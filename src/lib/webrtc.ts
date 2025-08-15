import Peer, { DataConnection, MediaConnection } from 'peerjs';

export type CallType = 'voice' | 'video' | 'screen';

export interface CallState {
  isConnected: boolean;
  isCallActive: boolean;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  remoteStream: MediaStream | null;
  localStream: MediaStream | null;
  error: string | null;
}

class WebRTCService {
  private peer: Peer | null = null;
  private currentCall: MediaConnection | null = null;
  private localStream: MediaStream | null = null;
  private onStateChange: ((state: Partial<CallState>) => void) | null = null;
  private onIncomingCall: ((call: MediaConnection, callType: CallType) => void) | null = null;

  async initialize(userId: string): Promise<void> {
    try {
      // Create peer with user's unique ID
      this.peer = new Peer(userId, {
        // Using public PeerJS server for development
        // In production, you'd want your own PeerServer
        host: 'peerjs-server.com',
        port: 443,
        secure: true,
        path: '/',
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      this.peer.on('open', (id) => {
        console.log('PeerJS connected with ID:', id);
        this.updateState({ isConnected: true });
      });

      this.peer.on('error', (error) => {
        console.error('PeerJS error:', error);
        this.updateState({ error: error.message, isConnected: false });
      });

      this.peer.on('call', (call) => {
        console.log('Incoming call from:', call.peer);
        this.handleIncomingCall(call);
      });

      this.peer.on('disconnected', () => {
        console.log('PeerJS disconnected');
        this.updateState({ isConnected: false });
      });

    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      this.updateState({ error: 'Failed to initialize calling service' });
    }
  }

  setStateChangeCallback(callback: (state: Partial<CallState>) => void): void {
    this.onStateChange = callback;
  }

  setIncomingCallCallback(callback: (call: MediaConnection, callType: CallType) => void): void {
    this.onIncomingCall = callback;
  }

  async startCall(remotePeerId: string, callType: CallType): Promise<void> {
    if (!this.peer) {
      throw new Error('WebRTC not initialized');
    }

    try {
      // Get user media based on call type
      this.localStream = await this.getUserMedia(callType);
      
      // Make the call
      const call = this.peer.call(remotePeerId, this.localStream);
      this.currentCall = call;

      this.updateState({ 
        isCallActive: true, 
        localStream: this.localStream,
        isVideoEnabled: callType === 'video',
        isScreenSharing: callType === 'screen'
      });

      call.on('stream', (remoteStream) => {
        console.log('Received remote stream');
        this.updateState({ remoteStream });
      });

      call.on('close', () => {
        console.log('Call ended');
        this.endCall();
      });

      call.on('error', (error) => {
        console.error('Call error:', error);
        this.updateState({ error: error.message });
      });

    } catch (error) {
      console.error('Failed to start call:', error);
      this.updateState({ error: 'Failed to start call: ' + (error as Error).message });
    }
  }

  async answerCall(call: MediaConnection, callType: CallType): Promise<void> {
    try {
      this.currentCall = call;
      this.localStream = await this.getUserMedia(callType);
      
      call.answer(this.localStream);
      
      this.updateState({ 
        isCallActive: true, 
        localStream: this.localStream,
        isVideoEnabled: callType === 'video',
        isScreenSharing: callType === 'screen'
      });

      call.on('stream', (remoteStream) => {
        console.log('Received remote stream');
        this.updateState({ remoteStream });
      });

      call.on('close', () => {
        console.log('Call ended');
        this.endCall();
      });

    } catch (error) {
      console.error('Failed to answer call:', error);
      this.updateState({ error: 'Failed to answer call: ' + (error as Error).message });
    }
  }

  endCall(): void {
    if (this.currentCall) {
      this.currentCall.close();
      this.currentCall = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.updateState({ 
      isCallActive: false, 
      localStream: null, 
      remoteStream: null,
      isVideoEnabled: false,
      isScreenSharing: false
    });
  }

  toggleMute(): void {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.updateState({ isMuted: !audioTrack.enabled });
      }
    }
  }

  toggleVideo(): void {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        this.updateState({ isVideoEnabled: videoTrack.enabled });
      }
    }
  }

  async switchToScreenShare(): Promise<void> {
    try {
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
      }

      this.localStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      if (this.currentCall) {
        // Replace video track in existing call
        const videoTrack = this.localStream.getVideoTracks()[0];
        const sender = (this.currentCall as any).peerConnection
          ?.getSenders()
          ?.find((s: RTCRtpSender) => s.track?.kind === 'video');
        
        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }
      }

      this.updateState({ 
        localStream: this.localStream, 
        isScreenSharing: true,
        isVideoEnabled: false 
      });

    } catch (error) {
      console.error('Failed to start screen sharing:', error);
      this.updateState({ error: 'Failed to start screen sharing' });
    }
  }

  private async getUserMedia(callType: CallType): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      audio: true,
      video: callType === 'video'
    };

    if (callType === 'screen') {
      return await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
    }

    return await navigator.mediaDevices.getUserMedia(constraints);
  }

  private handleIncomingCall(call: MediaConnection): void {
    // Determine call type based on stream tracks (simplified)
    const callType: CallType = 'voice'; // Default to voice, could be enhanced
    
    if (this.onIncomingCall) {
      this.onIncomingCall(call, callType);
    }
  }

  private updateState(state: Partial<CallState>): void {
    if (this.onStateChange) {
      this.onStateChange(state);
    }
  }

  destroy(): void {
    this.endCall();
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}

export const webRTCService = new WebRTCService();

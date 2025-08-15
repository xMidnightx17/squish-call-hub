import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { NotificationSounds } from '@/lib/notifications';

export interface CallState {
  isCallActive: boolean;
  isIncoming: boolean;
  isConnected: boolean;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  callType: 'voice' | 'video' | null;
  remoteStream: MediaStream | null;
  localStream: MediaStream | null;
  error: string | null;
}

export interface IncomingCall {
  callerId: string;
  callerName: string;
  callType: 'voice' | 'video';
  callId: string;
}

export type CallType = 'voice' | 'video' | 'screen';

const SIGNALING_SERVER_URL = import.meta.env.VITE_SIGNALING_SERVER_URL || 'http://localhost:3001';

export const useWebRTC = (userUniqueId: string) => {
  const [callState, setCallState] = useState<CallState>({
    isCallActive: false,
    isIncoming: false,
    isConnected: false,
    isMuted: false,
    isVideoEnabled: false,
    isScreenSharing: false,
    callType: null,
    remoteStream: null,
    localStream: null,
    error: null,
  });

  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const currentRoomRef = useRef<string | null>(null);

  // WebRTC configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // Initialize Socket.io connection
  useEffect(() => {
    if (!userUniqueId) return;

    console.log('🔌 Connecting to signaling server...');
    socketRef.current = io(SIGNALING_SERVER_URL);

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ Connected to signaling server');
      socket.emit('join', { uniqueId: userUniqueId, displayName: userUniqueId });
    });

    socket.on('joined', (data) => {
      console.log('👤 Joined signaling server:', data);
    });

    socket.on('incoming-call', (data: IncomingCall) => {
      console.log('📞 Incoming call:', data);
      setIncomingCall(data);
      setCallState(prev => ({ ...prev, isIncoming: true }));
      
      // Play cute incoming call ringtone 🎵
      NotificationSounds.playIncomingCall();
    });

    socket.on('call-accepted', async (data) => {
      console.log('✅ Call accepted:', data);
      currentRoomRef.current = data.roomId;
      await initiateWebRTCConnection();
      
      // Play cute call join sound ✨
      NotificationSounds.playCallJoin();
    });

    socket.on('call-rejected', (data) => {
      console.log('❌ Call rejected:', data);
      
      // Play gentle rejection sound
      NotificationSounds.playCallRejected();
      
      cleanupCall();
    });

    socket.on('call-ended', (data) => {
      console.log('📞❌ Call ended:', data);
      
      // Play cute call leave sound 👋
      NotificationSounds.playCallLeave();
      
      cleanupCall();
    });

    // WebRTC signaling handlers
    socket.on('webrtc-offer', async (data) => {
      console.log('🤝 Received WebRTC offer');
      await handleWebRTCOffer(data.offer);
    });

    socket.on('webrtc-answer', async (data) => {
      console.log('🤝 Received WebRTC answer');
      await handleWebRTCAnswer(data.answer);
    });

    socket.on('webrtc-ice-candidate', async (data) => {
      console.log('🧊 Received ICE candidate');
      await handleICECandidate(data.candidate);
    });

    return () => {
      socket.disconnect();
    };
  }, [userUniqueId]);

  // Create peer connection
  const createPeerConnection = useCallback(() => {
    const peerConnection = new RTCPeerConnection(rtcConfig);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && currentRoomRef.current) {
        console.log('🧊 Sending ICE candidate');
        socketRef.current.emit('webrtc-ice-candidate', {
          roomId: currentRoomRef.current,
          candidate: event.candidate,
        });
      }
    };

    peerConnection.ontrack = (event) => {
      console.log('🎥 Received remote stream');
      const remoteStream = event.streams[0];
      setCallState(prev => ({ 
        ...prev, 
        remoteStream,
        isConnected: true 
      }));
      
      // Play cute call join sound when stream is connected ✨
      NotificationSounds.playCallJoin();
    };

    peerConnection.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'connected') {
        setCallState(prev => ({ ...prev, isConnected: true }));
        
        // Play cute success sound when fully connected 🎉
        setTimeout(() => {
          NotificationSounds.playCallJoin();
        }, 500); // Small delay for better UX
        
      } else if (peerConnection.connectionState === 'disconnected' || 
                 peerConnection.connectionState === 'failed') {
        cleanupCall();
      }
    };

    return peerConnection;
  }, []);

  // Get user media
  const getUserMedia = async (callType: 'voice' | 'video') => {
    try {
      const constraints = {
        audio: true,
        video: callType === 'video',
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCallState(prev => ({ 
        ...prev, 
        localStream: stream,
        isVideoEnabled: callType === 'video' 
      }));
      
      return stream;
    } catch (error) {
      console.error('❌ Error getting user media:', error);
      throw error;
    }
  };

  // Initiate WebRTC connection
  const initiateWebRTCConnection = async () => {
    try {
      const peerConnection = createPeerConnection();
      peerConnectionRef.current = peerConnection;

      // Add local stream
      const localStream = callState.localStream;
      if (localStream) {
        localStream.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStream);
        });
      }

      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      if (socketRef.current && currentRoomRef.current) {
        socketRef.current.emit('webrtc-offer', {
          roomId: currentRoomRef.current,
          offer: offer,
        });
      }
    } catch (error) {
      console.error('❌ Error initiating WebRTC:', error);
    }
  };

  // Handle WebRTC offer
  const handleWebRTCOffer = async (offer: RTCSessionDescriptionInit) => {
    try {
      const peerConnection = createPeerConnection();
      peerConnectionRef.current = peerConnection;

      // Add local stream
      const localStream = callState.localStream;
      if (localStream) {
        localStream.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStream);
        });
      }

      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      if (socketRef.current && currentRoomRef.current) {
        socketRef.current.emit('webrtc-answer', {
          roomId: currentRoomRef.current,
          answer: answer,
        });
      }
    } catch (error) {
      console.error('❌ Error handling WebRTC offer:', error);
    }
  };

  // Handle WebRTC answer
  const handleWebRTCAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(answer);
      }
    } catch (error) {
      console.error('❌ Error handling WebRTC answer:', error);
    }
  };

  // Handle ICE candidate
  const handleICECandidate = async (candidate: RTCIceCandidateInit) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(candidate);
      }
    } catch (error) {
      console.error('❌ Error handling ICE candidate:', error);
    }
  };

  // Start call
  const startCall = async (targetUserId: string, callType: CallType) => {
    try {
      console.log(`📞 Starting ${callType} call to:`, targetUserId);
      
      const actualCallType = callType === 'screen' ? 'video' : callType;
      const stream = await getUserMedia(actualCallType);
      
      setCallState(prev => ({ 
        ...prev, 
        isCallActive: true, 
        callType: actualCallType,
        localStream: stream 
      }));

      // Play cute call initiation sound 🎵
      NotificationSounds.playCallInitiated();

      if (socketRef.current) {
        socketRef.current.emit('initiate-call', {
          targetUserId,
          callType: actualCallType,
          callerInfo: { uniqueId: userUniqueId, displayName: userUniqueId },
        });
      }
    } catch (error) {
      console.error('❌ Error starting call:', error);
      setCallState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to start call' 
      }));
      cleanupCall();
    }
  };

  // Answer call
  const answerCall = async () => {
    if (!incomingCall) return;

    try {
      console.log('✅ Answering call:', incomingCall.callId);
      
      const stream = await getUserMedia(incomingCall.callType);
      currentRoomRef.current = incomingCall.callId;
      
      setCallState(prev => ({ 
        ...prev, 
        isCallActive: true, 
        isIncoming: false,
        callType: incomingCall.callType,
        localStream: stream 
      }));

      if (socketRef.current) {
        socketRef.current.emit('accept-call', {
          callerId: incomingCall.callerId,
          callId: incomingCall.callId,
        });
      }

      setIncomingCall(null);
      
      // Play cute call join sound when answering ✨
      NotificationSounds.playCallJoin();
    } catch (error) {
      console.error('❌ Error answering call:', error);
      setCallState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to answer call' 
      }));
      rejectCall();
    }
  };

  // Reject call
  const rejectCall = () => {
    if (!incomingCall) return;

    console.log('❌ Rejecting call:', incomingCall.callId);
    
    if (socketRef.current) {
      socketRef.current.emit('reject-call', {
        callerId: incomingCall.callerId,
        callId: incomingCall.callId,
      });
    }

    setIncomingCall(null);
    setCallState(prev => ({ ...prev, isIncoming: false }));
  };

  // End call
  const endCall = () => {
    console.log('📞❌ Ending call');
    
    // Play cute call leave sound 👋
    NotificationSounds.playCallLeave();
    
    if (socketRef.current && currentRoomRef.current) {
      socketRef.current.emit('end-call', {
        roomId: currentRoomRef.current,
        callId: currentRoomRef.current,
      });
    }

    cleanupCall();
  };

  // Cleanup call
  const cleanupCall = () => {
    console.log('🧹 Cleaning up call');

    // Stop local stream
    if (callState.localStream) {
      callState.localStream.getTracks().forEach(track => track.stop());
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Reset state
    setCallState({
      isCallActive: false,
      isIncoming: false,
      isConnected: false,
      isMuted: false,
      isVideoEnabled: false,
      isScreenSharing: false,
      callType: null,
      remoteStream: null,
      localStream: null,
      error: null,
    });

    setIncomingCall(null);
    currentRoomRef.current = null;
  };

  // Toggle mute
  const toggleMute = () => {
    if (callState.localStream) {
      const audioTrack = callState.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallState(prev => ({ ...prev, isMuted: !audioTrack.enabled }));
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (callState.localStream) {
      const videoTrack = callState.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCallState(prev => ({ ...prev, isVideoEnabled: videoTrack.enabled }));
      }
    }
  };

  // Start screen share
  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      if (peerConnectionRef.current && callState.localStream) {
        // Replace video track with screen share
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );

        if (sender) {
          await sender.replaceTrack(videoTrack);
        }

        setCallState(prev => ({ 
          ...prev, 
          isScreenSharing: true,
          localStream: screenStream 
        }));

        // Handle screen share end
        videoTrack.onended = () => {
          setCallState(prev => ({ ...prev, isScreenSharing: false }));
        };
      }
    } catch (error) {
      console.error('❌ Error starting screen share:', error);
    }
  };

  return {
    callState,
    incomingCall,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    startScreenShare,
    localVideoRef,
    remoteVideoRef,
  };
};

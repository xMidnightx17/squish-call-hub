import { useState, useEffect, useCallback } from 'react';
import { webRTCService, CallState, CallType } from '@/lib/webrtc';
import { MediaConnection } from 'peerjs';

export type { CallType };

const initialCallState: CallState = {
  isConnected: false,
  isCallActive: false,
  isMuted: false,
  isVideoEnabled: false,
  isScreenSharing: false,
  remoteStream: null,
  localStream: null,
  error: null,
};

export const useWebRTC = (userId: string) => {
  const [callState, setCallState] = useState<CallState>(initialCallState);
  const [incomingCall, setIncomingCall] = useState<{
    call: MediaConnection;
    callType: CallType;
  } | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Initialize WebRTC service
    webRTCService.initialize(userId);

    // Set up state change callback
    webRTCService.setStateChangeCallback((state) => {
      setCallState(prev => ({ ...prev, ...state }));
    });

    // Set up incoming call callback
    webRTCService.setIncomingCallCallback((call, callType) => {
      setIncomingCall({ call, callType });
    });

    // Cleanup on unmount
    return () => {
      webRTCService.destroy();
    };
  }, [userId]);

  const startCall = useCallback(async (remotePeerId: string, callType: CallType) => {
    try {
      await webRTCService.startCall(remotePeerId, callType);
    } catch (error) {
      console.error('Failed to start call:', error);
    }
  }, []);

  const answerCall = useCallback(async (callType: CallType = 'voice') => {
    if (incomingCall) {
      try {
        await webRTCService.answerCall(incomingCall.call, callType);
        setIncomingCall(null);
      } catch (error) {
        console.error('Failed to answer call:', error);
      }
    }
  }, [incomingCall]);

  const rejectCall = useCallback(() => {
    if (incomingCall) {
      incomingCall.call.close();
      setIncomingCall(null);
    }
  }, [incomingCall]);

  const endCall = useCallback(() => {
    webRTCService.endCall();
  }, []);

  const toggleMute = useCallback(() => {
    webRTCService.toggleMute();
  }, []);

  const toggleVideo = useCallback(() => {
    webRTCService.toggleVideo();
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      await webRTCService.switchToScreenShare();
    } catch (error) {
      console.error('Failed to start screen share:', error);
    }
  }, []);

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
  };
};

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  MonitorOff,
  Maximize2,
  Minimize2,
  Users
} from "lucide-react";
import { CallState, CallType } from "@/lib/webrtc";

interface CallOverlayProps {
  callState: CallState;
  callType: CallType;
  participants: string[];
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onStartScreenShare: () => void;
}

const CallOverlay = ({ 
  callState, 
  callType, 
  participants, 
  onEndCall,
  onToggleMute,
  onToggleVideo,
  onStartScreenShare
}: CallOverlayProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const dragRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Set up video streams
  useEffect(() => {
    if (localVideoRef.current && callState.localStream) {
      localVideoRef.current.srcObject = callState.localStream;
    }
  }, [callState.localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && callState.remoteStream) {
      remoteVideoRef.current.srcObject = callState.remoteStream;
    }
  }, [callState.remoteStream]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isFullscreen) return;
    setIsDragging(true);
    
    const rect = dragRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = ((e.clientX - offsetX) / window.innerWidth) * 100;
      const newY = ((e.clientY - offsetY) / window.innerHeight) * 100;
      
      setPosition({
        x: Math.max(0, Math.min(100 - 25, newX)),
        y: Math.max(0, Math.min(100 - 30, newY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getCallIcon = () => {
    switch (callType) {
      case 'voice':
        return <Phone className="w-6 h-6" />;
      case 'video':
        return <Video className="w-6 h-6" />;
      case 'screen':
        return <Monitor className="w-6 h-6" />;
    }
  };

  const isVideoCall = callType === 'video' || callState.isVideoEnabled || callState.isScreenSharing;

  return (
    <div className="call-overlay">
      <div
        ref={dragRef}
        className={`call-window transition-all duration-300 ${
          isFullscreen 
            ? 'inset-4 w-auto h-auto' 
            : 'w-96 h-auto cursor-move'
        }`}
        style={
          !isFullscreen 
            ? {
                left: `${position.x}%`,
                top: `${position.y}%`,
                transform: 'translate(0, 0)'
              }
            : {}
        }
        onMouseDown={handleMouseDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            {getCallIcon()}
            <div>
              <h3 className="font-semibold text-primary-foreground">
                {callState.isScreenSharing ? 'Screen Sharing' : 
                 callType === 'video' ? 'Video Call' : 'Voice Call'}
              </h3>
              <p className="text-sm text-primary-foreground/70">
                {participants.length > 1 ? `${participants.length} participants` : participants[0]}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Video Area */}
        {isVideoCall && (
          <div className={`relative bg-black ${isFullscreen ? 'h-[calc(100vh-12rem)]' : 'h-64'}`}>
            {/* Remote Video */}
            {callState.remoteStream && (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Local Video (Picture-in-Picture) */}
            {callState.localStream && (
              <div className="absolute top-4 right-4 w-24 h-18 bg-black rounded-lg overflow-hidden border-2 border-primary">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* No video placeholder */}
            {!callState.remoteStream && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-primary-foreground/70">
                  <Users className="w-16 h-16 mx-auto mb-2" />
                  <p>Waiting for {participants[0]} to join...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Voice Call Display */}
        {!isVideoCall && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-foreground">
                {participants[0]?.[0] || 'U'}
              </span>
            </div>
            <p className="text-lg font-semibold text-primary-foreground mb-2">
              {participants[0] || 'Unknown'}
            </p>
            <p className="text-sm text-primary-foreground/70">
              {callState.remoteStream ? 'Connected' : 'Connecting...'}
            </p>
          </div>
        )}

        {/* Error Display */}
        {callState.error && (
          <div className="p-4 bg-destructive/20 border-l-4 border-destructive">
            <p className="text-sm text-destructive-foreground">
              {callState.error}
            </p>
          </div>
        )}

        {/* Call Controls */}
        <div className="p-4 border-t border-border/30">
          <div className="flex items-center justify-center gap-3">
            {/* Mute Button */}
            <Button
              onClick={onToggleMute}
              variant={callState.isMuted ? "destructive" : "secondary"}
              size="icon"
              className="rounded-full w-12 h-12"
            >
              {callState.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>

            {/* Video Toggle (if video call) */}
            {(callType === 'video' || callState.isVideoEnabled) && (
              <Button
                onClick={onToggleVideo}
                variant={callState.isVideoEnabled ? "secondary" : "destructive"}
                size="icon"
                className="rounded-full w-12 h-12"
              >
                {callState.isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </Button>
            )}

            {/* Screen Share Button */}
            <Button
              onClick={onStartScreenShare}
              variant={callState.isScreenSharing ? "default" : "secondary"}
              size="icon"
              className="rounded-full w-12 h-12"
            >
              {callState.isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            </Button>

            {/* End Call Button */}
            <Button
              onClick={onEndCall}
              variant="destructive"
              size="icon"
              className="rounded-full w-12 h-12 bg-red-600 hover:bg-red-700"
            >
              <PhoneOff className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallOverlay;
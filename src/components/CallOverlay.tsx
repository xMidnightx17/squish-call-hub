import { useState, useRef } from "react";
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
  Settings,
  Users
} from "lucide-react";

interface CallOverlayProps {
  callType: 'voice' | 'video' | 'screen';
  participants: string[];
  onEndCall: () => void;
}

const CallOverlay = ({ callType, participants, onEndCall }: CallOverlayProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(callType === 'video');
  const [isScreenSharing, setIsScreenSharing] = useState(callType === 'screen');
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const dragRef = useRef<HTMLDivElement>(null);

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
        x: Math.max(0, Math.min(100 - 25, newX)), // 25% is approximate width
        y: Math.max(0, Math.min(100 - 30, newY))  // 30% is approximate height
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

  return (
    <div className="call-overlay">
      <div
        ref={dragRef}
        className={`call-window transition-all duration-300 ${
          isFullscreen 
            ? 'inset-4 w-auto h-auto' 
            : 'w-80 h-96 cursor-move'
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
            <div className="p-2 rounded-xl bg-primary/20 text-primary">
              {getCallIcon()}
            </div>
            <div>
              <h3 className="font-semibold">
                {callType === 'voice' && 'Voice Call'}
                {callType === 'video' && 'Video Call'}
                {callType === 'screen' && 'Screen Share'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {participants.length} participant{participants.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="hover:bg-secondary/50 rounded-xl w-8 h-8"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 relative overflow-hidden">
          {callType === 'video' || callType === 'screen' ? (
            <div className="w-full h-full bg-gradient-to-br from-secondary/20 to-muted/20 flex items-center justify-center">
              {callType === 'screen' ? (
                <div className="text-center">
                  <Monitor className="w-16 h-16 mx-auto mb-4 text-primary" />
                  <p className="text-lg font-medium">Screen Sharing</p>
                  <p className="text-sm text-muted-foreground">Your screen is being shared</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-primary-foreground mx-auto mb-4">
                    {participants[0]?.[0] || 'U'}
                  </div>
                  <p className="text-lg font-medium">{participants[0] || 'User'}</p>
                  <p className="text-sm text-muted-foreground">Video call in progress</p>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-primary-foreground mx-auto mb-4 glow animate-pulse">
                  {participants[0]?.[0] || 'U'}
                </div>
                <p className="text-lg font-medium">{participants[0] || 'User'}</p>
                <p className="text-sm text-muted-foreground">Voice call in progress</p>
                <div className="flex justify-center mt-4">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-1 h-6 bg-primary rounded-full glow animate-pulse"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-border/30">
          <div className="flex items-center justify-center gap-3">
            {/* Mute/Unmute */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className={`rounded-2xl w-12 h-12 ${
                isMuted 
                  ? 'bg-destructive/20 text-destructive hover:bg-destructive/30' 
                  : 'bg-secondary/50 hover:bg-secondary'
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>

            {/* Video Toggle (for video calls) */}
            {(callType === 'video' || callType === 'screen') && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsVideoOn(!isVideoOn)}
                className={`rounded-2xl w-12 h-12 ${
                  !isVideoOn 
                    ? 'bg-destructive/20 text-destructive hover:bg-destructive/30' 
                    : 'bg-secondary/50 hover:bg-secondary'
                }`}
              >
                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </Button>
            )}

            {/* Screen Share Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsScreenSharing(!isScreenSharing)}
              className={`rounded-2xl w-12 h-12 ${
                isScreenSharing 
                  ? 'bg-primary/20 text-primary hover:bg-primary/30' 
                  : 'bg-secondary/50 hover:bg-secondary'
              }`}
            >
              {isScreenSharing ? <Monitor className="w-5 h-5" /> : <MonitorOff className="w-5 h-5" />}
            </Button>

            {/* Participants */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-2xl w-12 h-12 bg-secondary/50 hover:bg-secondary"
            >
              <Users className="w-5 h-5" />
            </Button>

            {/* Settings */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-2xl w-12 h-12 bg-secondary/50 hover:bg-secondary"
            >
              <Settings className="w-5 h-5" />
            </Button>

            {/* End Call */}
            <Button
              onClick={onEndCall}
              className="rounded-2xl w-12 h-12 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
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
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Phone, Video, Monitor, Send, ArrowLeft } from "lucide-react";
import CallOverlay from "./CallOverlay";

interface ChatWindowProps {
  friend: {
    name: string;
    uniqueId: string;
    lastSeen: string;
  };
  onBack: () => void;
}

const ChatWindow = ({ friend, onBack }: ChatWindowProps) => {
  const [message, setMessage] = useState("");
  const [activeCall, setActiveCall] = useState<{
    type: 'voice' | 'video' | 'screen';
    participants: string[];
  } | null>(null);

  const handleStartCall = (type: 'voice' | 'video' | 'screen') => {
    setActiveCall({
      type,
      participants: [friend.name]
    });
  };

  const handleEndCall = () => {
    setActiveCall(null);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      // TODO: Send message logic
      console.log('Sending message:', message);
      setMessage("");
    }
  };

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30 bg-card/50">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="hover:bg-secondary/50 rounded-2xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
              {friend.name[0]}
            </div>
            <div>
              <h3 className="font-semibold">{friend.name}</h3>
              <p className="text-sm text-muted-foreground">{friend.lastSeen}</p>
            </div>
          </div>

          {/* Call Controls */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleStartCall('voice')}
              variant="ghost"
              size="icon"
              className="hover:bg-primary/20 rounded-2xl text-primary"
            >
              <Phone className="w-5 h-5" />
            </Button>
            
            <Button
              onClick={() => handleStartCall('video')}
              variant="ghost"
              size="icon"
              className="hover:bg-accent/20 rounded-2xl text-accent"
            >
              <Video className="w-5 h-5" />
            </Button>
            
            <Button
              onClick={() => handleStartCall('screen')}
              variant="ghost"
              size="icon"
              className="hover:bg-secondary rounded-2xl"
            >
              <Monitor className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {/* Sample messages */}
            <div className="flex justify-start">
              <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl bg-secondary/50 text-secondary-foreground">
                <p>Hey! How's it going? 😊</p>
                <p className="text-xs text-muted-foreground mt-1">2:30 PM</p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl bg-primary text-primary-foreground">
                <p>Great! Just working on some projects. Want to chat?</p>
                <p className="text-xs text-primary-foreground/70 mt-1">2:32 PM</p>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="text-xs text-muted-foreground bg-secondary/30 px-3 py-1 rounded-full">
                You can now start voice, video calls, or screen sharing! ✨
              </div>
            </div>
          </div>
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-border/30">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-2xl border-2 border-border/50 bg-input/50 focus:border-primary focus:glow transition-all"
            />
            <Button
              type="submit"
              className="btn-neon px-4"
              disabled={!message.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* Call Overlay */}
      {activeCall && (
        <CallOverlay
          callType={activeCall.type}
          participants={activeCall.participants}
          onEndCall={handleEndCall}
        />
      )}
    </>
  );
};

export default ChatWindow;
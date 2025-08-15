import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, PhoneOff, Video, Monitor } from "lucide-react";
import { CallType } from "@/hooks/use-webrtc";

interface IncomingCallModalProps {
  isOpen: boolean;
  callerName: string;
  callType: CallType;
  onAccept: () => void;
  onReject: () => void;
}

const IncomingCallModal = ({
  isOpen,
  callerName,
  callType,
  onAccept,
  onReject
}: IncomingCallModalProps) => {
  const getCallIcon = () => {
    switch (callType) {
      case 'voice':
        return <Phone className="w-8 h-8 text-primary" />;
      case 'video':
        return <Video className="w-8 h-8 text-primary" />;
      case 'screen':
        return <Monitor className="w-8 h-8 text-primary" />;
    }
  };

  const getCallTypeText = () => {
    switch (callType) {
      case 'voice':
        return 'Voice Call';
      case 'video':
        return 'Video Call';
      case 'screen':
        return 'Screen Share';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Incoming Call</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6 p-6">
          {/* Caller Avatar */}
          <div className="relative">
            <Avatar className="w-24 h-24 border-4 border-primary/30">
              <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary to-accent">
                {callerName[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            {/* Call Type Icon */}
            <div className="absolute -bottom-2 -right-2 p-2 bg-card border-2 border-primary rounded-full">
              {getCallIcon()}
            </div>
          </div>

          {/* Caller Info */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-primary-foreground">
              {callerName}
            </h3>
            <p className="text-muted-foreground">
              Incoming {getCallTypeText()}
            </p>
          </div>

          {/* Call Actions */}
          <div className="flex gap-6">
            {/* Reject Button */}
            <Button
              onClick={onReject}
              variant="destructive"
              size="lg"
              className="rounded-full w-16 h-16 p-0"
            >
              <PhoneOff className="w-6 h-6" />
            </Button>

            {/* Accept Button */}
            <Button
              onClick={onAccept}
              className="rounded-full w-16 h-16 p-0 bg-green-600 hover:bg-green-700"
            >
              <Phone className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IncomingCallModal;

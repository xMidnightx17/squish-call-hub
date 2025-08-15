import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Radio } from "lucide-react";

interface ConnectionStatusProps {
  isConnected: boolean;
  isCallActive: boolean;
  className?: string;
}

const ConnectionStatus = ({ isConnected, isCallActive, className = "" }: ConnectionStatusProps) => {
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Show status indicator when call is active or connection changes
    if (isCallActive || !isConnected) {
      setShowStatus(true);
    } else {
      // Hide after a delay when connected and no call
      const timer = setTimeout(() => setShowStatus(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, isCallActive]);

  if (!showStatus) return null;

  const getStatusInfo = () => {
    if (!isConnected) {
      return {
        icon: <WifiOff className="w-3 h-3" />,
        text: "Disconnected",
        variant: "destructive" as const,
        className: "bg-red-600/20 text-red-400 border-red-600/30"
      };
    }

    if (isCallActive) {
      return {
        icon: <Radio className="w-3 h-3" />,
        text: "In Call",
        variant: "default" as const,
        className: "bg-green-600/20 text-green-400 border-green-600/30"
      };
    }

    return {
      icon: <Wifi className="w-3 h-3" />,
      text: "Connected",
      variant: "secondary" as const,
      className: "bg-primary/20 text-primary border-primary/30"
    };
  };

  const status = getStatusInfo();

  return (
    <Badge 
      variant={status.variant}
      className={`${status.className} ${className} animate-fade-in`}
    >
      {status.icon}
      <span className="ml-1 text-xs">{status.text}</span>
    </Badge>
  );
};

export default ConnectionStatus;

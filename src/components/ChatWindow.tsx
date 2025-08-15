import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Phone, Video, Monitor, Send, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CallOverlay from "./CallOverlay";
import IncomingCallModal from "./IncomingCallModal";
import ConnectionStatus from "./ConnectionStatus";
import { useWebRTC, CallType } from "@/hooks/use-webrtc-real";
import { NotificationSounds, requestNotificationPermission, showNotification } from "@/lib/notifications";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  message_type: string;
  created_at: string;
  is_read: boolean;
  sender_display_name: string;
}

interface ChatWindowProps {
  friend: {
    name: string;
    uniqueId: string;
    lastSeen: string;
  };
  currentUserId: string;
  currentUserUniqueId: string;
  onBack: () => void;
}

const ChatWindow = ({ friend, currentUserId, currentUserUniqueId, onBack }: ChatWindowProps) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserDbId, setCurrentUserDbId] = useState<string | null>(null);
  const [friendDbId, setFriendDbId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // WebRTC Integration
  const {
    callState,
    incomingCall,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    startScreenShare
  } = useWebRTC(currentUserUniqueId);

  // Request notification permission on component mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Handle incoming call notifications
  useEffect(() => {
    if (incomingCall) {
      NotificationSounds.playIncomingCall();
      showNotification('Incoming Call', {
        body: `${friend.name} is calling you`,
        requireInteraction: true
      });
    }
  }, [incomingCall, friend.name]);

  // Handle call state changes
  useEffect(() => {
    if (callState.isCallActive && callState.remoteStream) {
      NotificationSounds.playCallConnect();
    }
  }, [callState.isCallActive, callState.remoteStream]);

  // Get database IDs for both users
  useEffect(() => {
    const getUserIds = async () => {
      try {
        console.log('Getting user IDs...', { currentUserUniqueId, friendUniqueId: friend.uniqueId });
        
        // Get current user's DB ID
        const { data: currentUser } = await supabase
          .from('chat_users')
          .select('id')
          .eq('unique_id', currentUserUniqueId)
          .single();

        // Get friend's DB ID  
        const { data: friendUser } = await supabase
          .from('chat_users')
          .select('id')
          .eq('unique_id', friend.uniqueId)
          .single();

        console.log('User IDs result:', { currentUser, friendUser });

        if (currentUser?.id) setCurrentUserDbId(currentUser.id);
        if (friendUser?.id) setFriendDbId(friendUser.id);
        
      } catch (error) {
        console.error('Error getting user IDs:', error);
      }
    };

    getUserIds();
  }, [currentUserUniqueId, friend.uniqueId]);

  // Load conversation messages and set up real-time subscription
  useEffect(() => {
    if (currentUserDbId && friendDbId) {
      loadMessages();
      
      // Set up real-time subscription for new messages
      console.log('Setting up real-time subscription for messages...');
      const subscription = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `or(and(sender_id.eq.${currentUserDbId},recipient_id.eq.${friendDbId}),and(sender_id.eq.${friendDbId},recipient_id.eq.${currentUserDbId}))`
          },
          (payload) => {
            console.log('New message received:', payload);
            const newMessage = payload.new as any;
            
            // Add sender display name
            const messageWithSender: Message = {
              ...newMessage,
              sender_display_name: newMessage.sender_id === currentUserDbId ? currentUserId : friend.name
            };
            
            setMessages(prev => {
              // Avoid duplicates
              if (prev.some(msg => msg.id === messageWithSender.id)) {
                return prev;
              }
              
              // Play notification sound for incoming messages
              if (messageWithSender.sender_id !== currentUserDbId) {
                NotificationSounds.playMessageNotification();
                showNotification('New Message', {
                  body: `${friend.name}: ${messageWithSender.content.substring(0, 50)}${messageWithSender.content.length > 50 ? '...' : ''}`,
                });
              }
              
              return [...prev, messageWithSender];
            });
          }
        )
        .subscribe();

      // Cleanup subscription on unmount
      return () => {
        console.log('Cleaning up real-time subscription...');
        subscription.unsubscribe();
      };
    }
  }, [currentUserDbId, friendDbId, currentUserId, friend.name]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    if (!currentUserDbId || !friendDbId) return;
    
    try {
      console.log('Loading messages between:', currentUserDbId, 'and', friendDbId);
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          recipient_id,
          content,
          message_type,
          created_at,
          is_read,
          sender:chat_users!messages_sender_id_fkey(display_name)
        `)
        .or(`and(sender_id.eq.${currentUserDbId},recipient_id.eq.${friendDbId}),and(sender_id.eq.${friendDbId},recipient_id.eq.${currentUserDbId})`)
        .order('created_at', { ascending: true });

      console.log('Messages loaded:', { data, error });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      // Transform the data to match our Message interface
      const transformedMessages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        sender_id: msg.sender_id,
        recipient_id: msg.recipient_id,
        content: msg.content,
        message_type: msg.message_type,
        created_at: msg.created_at,
        is_read: msg.is_read,
        sender_display_name: (msg.sender as any)?.display_name || 'Unknown'
      }));

      setMessages(transformedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleStartCall = async (type: CallType) => {
    try {
      await startCall(friend.uniqueId, type);
      toast({
        title: "Calling...",
        description: `Starting ${type} call with ${friend.name}`,
      });
    } catch (error) {
      console.error('Failed to start call:', error);
      toast({
        title: "Call Failed",
        description: "Unable to start the call. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEndCall = () => {
    endCall();
    NotificationSounds.playCallEnd();
    toast({
      title: "Call Ended",
      description: "The call has been disconnected.",
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentUserDbId || !friendDbId) return;
    
    setLoading(true);
    try {
      console.log('Sending message:', message);
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUserDbId,
          recipient_id: friendDbId,
          content: message.trim(),
          message_type: 'text'
        })
        .select(`
          id,
          sender_id,
          recipient_id,
          content,
          message_type,
          created_at,
          is_read
        `)
        .single();

      console.log('Message sent result:', { data, error });

      if (error) {
        throw error;
      }

      // Add the new message to our local state
      if (data) {
        const newMessage: Message = {
          ...data,
          sender_display_name: currentUserId
        };
        setMessages(prev => [...prev, newMessage]);
      }
      
      setMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message: " + (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">{friend.lastSeen}</p>
                <ConnectionStatus 
                  isConnected={callState.isConnected}
                  isCallActive={callState.isCallActive}
                />
              </div>
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
            {messages.length === 0 ? (
              <div className="flex justify-center">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg mb-2">Start your conversation!</p>
                  <p className="text-sm">Send a message to {friend.name}</p>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === currentUserDbId ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      msg.sender_id === currentUserDbId
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 text-secondary-foreground'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.sender_id === currentUserDbId
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
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
      {callState.isCallActive && (
        <CallOverlay
          callState={callState}
          callType={callState.isScreenSharing ? 'screen' : callState.isVideoEnabled ? 'video' : 'voice'}
          participants={[friend.name]}
          onEndCall={handleEndCall}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onStartScreenShare={startScreenShare}
        />
      )}

      {/* Incoming Call Modal */}
      {incomingCall && (
        <IncomingCallModal
          isOpen={true}
          callerName={friend.name}
          callType={incomingCall.callType}
          onAccept={answerCall}
          onReject={rejectCall}
        />
      )}
    </>
  );
};

export default ChatWindow;
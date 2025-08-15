import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Phone, Video, Users, MessageSquare, Settings, LogOut, UserPlus, Copy, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatWindow from "./ChatWindow";
import FriendsTab from "./FriendsTab";
import { useUserPresence } from "@/hooks/use-user-presence";
import { useToast } from "@/hooks/use-toast";

interface MainDashboardProps {
  userInfo: { displayName: string; uniqueId: string };
  onLogout: () => void;
}

const MainDashboard = ({ userInfo, onLogout }: MainDashboardProps) => {
  const [activeChatFriend, setActiveChatFriend] = useState<{
    name: string;
    uniqueId: string;
    lastSeen: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Initialize user presence tracking
  useUserPresence(userInfo.uniqueId);

  const friends = [
    { name: 'CuteBot123', uniqueId: 'CUTE1234567890', lastSeen: 'Last seen 2h ago' },
    { name: 'NeonFriend456', uniqueId: 'NEON9876543210', lastSeen: 'Last seen 5m ago' },
    { name: 'TealMaster789', uniqueId: 'TEAL1122334455', lastSeen: 'Online now' }
  ];

  const handleStartChat = (friend: typeof friends[0]) => {
    setActiveChatFriend(friend);
  };

  const handleBackToMain = () => {
    setActiveChatFriend(null);
  };

  const copyUniqueId = async () => {
    try {
      // Modern clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(userInfo.uniqueId);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = userInfo.uniqueId;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!successful) {
          throw new Error('Copy command failed');
        }
      }
      
      setCopied(true);
      toast({
        title: "Copied! 📋",
        description: "Your unique ID has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // If all else fails, select the text for manual copying
      const element = document.getElementById('unique-id-text');
      if (element && window.getSelection) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(element);
        selection?.removeAllRanges();
        selection?.addRange(range);
        
        toast({
          title: "Text selected! 📋",
          description: "Your unique ID is selected - press Ctrl+C to copy",
          variant: "default"
        });
      } else {
        toast({
          title: "Copy not supported",
          description: `Please manually copy: ${userInfo.uniqueId}`,
          variant: "destructive"
        });
      }
    }
  };

  // Show chat window if a friend is selected
  if (activeChatFriend) {
    return (
      <div className="h-screen flex flex-col">
        <ChatWindow 
          friend={activeChatFriend} 
          currentUserId={userInfo.displayName}
          currentUserUniqueId={userInfo.uniqueId}
          onBack={handleBackToMain} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Chat2Chat-Web
            </h1>
            <p className="text-sm text-muted-foreground">Welcome back, {userInfo.displayName}!</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hover:bg-secondary/50 rounded-2xl">
            <Settings className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="hover:bg-destructive/20 rounded-2xl text-destructive hover:text-destructive"
            onClick={onLogout}
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="friends" className="w-full">
            {/* Top Navigation Tabs */}
            <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-4 mb-6 bg-secondary/50 rounded-2xl h-12">
              <TabsTrigger value="add-friend" className="rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Friend
              </TabsTrigger>
              <TabsTrigger value="friends" className="rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Users className="w-4 h-4 mr-2" />
                Friends
              </TabsTrigger>
              <TabsTrigger value="chats" className="rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <MessageSquare className="w-4 h-4 mr-2" />
                Recent Chats
              </TabsTrigger>
              <TabsTrigger value="calls" className="rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Phone className="w-4 h-4 mr-2" />
                Call History
              </TabsTrigger>
            </TabsList>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-16rem)]">
              {/* Main Content - Now Much Bigger */}
              <div className="lg:col-span-4 h-full">
                <TabsContent value="add-friend" className="m-0 h-full">
                  <Card className="card-cute h-full">
                    <h2 className="text-2xl font-semibold mb-6">Add New Friend</h2>
                    <div className="max-w-2xl">
                      {/* Just the add friend section from FriendsTab */}
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <Input
                            placeholder="Enter friend's unique ID (e.g., CUTE1234567890)"
                            className="flex-1 rounded-2xl border-2 border-border/50 bg-input/50 focus:border-primary focus:glow transition-all text-lg py-6"
                          />
                          <Button className="btn-neon px-8 py-6 text-lg">
                            <UserPlus className="w-5 h-5 mr-2" />
                            Add Friend
                          </Button>
                        </div>
                        <div className="bg-secondary/30 rounded-2xl p-6">
                          <h3 className="font-semibold mb-3">💡 How to add friends:</h3>
                          <ul className="text-sm text-muted-foreground space-y-2">
                            <li>• Ask your friends for their unique ID</li>
                            <li>• Each ID is unique and generated when they sign up</li>
                            <li>• Once added, you can chat and call them directly!</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="friends" className="m-0 h-full">
                  <FriendsTab 
                    currentUserId={userInfo.displayName}
                    currentUserUniqueId={userInfo.uniqueId}
                  />
                </TabsContent>

                <TabsContent value="chats" className="m-0">
                  <Card className="card-cute">
                    <h2 className="text-2xl font-semibold mb-6">Recent Chats</h2>
                    <div className="space-y-4">
                      {friends.map((friend, index) => (
                        <div
                          key={friend.name}
                          className="flex items-center gap-4 p-4 hover:bg-secondary/30 rounded-2xl transition-colors cursor-pointer"
                          onClick={() => handleStartChat(friend)}
                        >
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-lg">
                            {friend.name[0]}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-lg">{friend.name}</p>
                            <p className="text-muted-foreground">{friend.lastSeen}</p>
                          </div>
                          <div className="text-sm text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg">
                            Click to chat & call
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="calls" className="m-0">
                  <Card className="card-cute">
                    <h2 className="text-2xl font-semibold mb-6">Call History</h2>
                    <div className="space-y-4">
                      <div className="text-center py-12 text-muted-foreground">
                        <Phone className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No call history yet</p>
                        <p>Start chatting with friends to make calls!</p>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              </div>

              {/* Sidebar - Now Much Smaller */}
              <div className="lg:col-span-1">
                {/* User Info - Compact */}
                <Card className="card-cute">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold mx-auto mb-2">
                      {userInfo.displayName[0]}
                    </div>
                    <h3 className="font-semibold">{userInfo.displayName}</h3>
                    <div className="relative mt-2">
                      <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-2 py-1">
                        <p 
                          id="unique-id-text"
                          className="text-xs text-muted-foreground font-mono break-all flex-1 select-all"
                        >
                          {userInfo.uniqueId}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={copyUniqueId}
                          className="h-6 w-6 hover:bg-primary/20 rounded-md shrink-0"
                          title="Copy your unique ID"
                        >
                          {copied ? (
                            <Check className="h-3 w-3 text-primary" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <div className="w-2 h-2 rounded-full bg-primary glow-strong"></div>
                      <span className="text-xs text-primary font-medium">Online</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    );
};

export default MainDashboard;
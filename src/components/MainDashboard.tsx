import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Phone, Video, Users, MessageSquare, Settings, LogOut, UserCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatWindow from "./ChatWindow";
import FriendsTab from "./FriendsTab";

interface MainDashboardProps {
  userInfo: { displayName: string; uniqueId: string };
  onLogout: () => void;
}

const MainDashboard = ({ userInfo, onLogout }: MainDashboardProps) => {
  const [activeTab, setActiveTab] = useState<'chats' | 'friends'>('chats');
  const [activeChatFriend, setActiveChatFriend] = useState<{
    name: string;
    uniqueId: string;
    lastSeen: string;
  } | null>(null);

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

  // Show chat window if a friend is selected
  if (activeChatFriend) {
    return (
      <div className="h-screen flex flex-col">
        <ChatWindow friend={activeChatFriend} onBack={handleBackToMain} />
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Left Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <Card className="card-cute">
              <div className="flex gap-2">
                <Button
                  variant={activeTab === 'chats' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('chats')}
                  className={activeTab === 'chats' 
                    ? "btn-neon" 
                    : "hover:bg-secondary/50 rounded-2xl"
                  }
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Recent Chats
                </Button>
                <Button
                  variant={activeTab === 'friends' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('friends')}
                  className={activeTab === 'friends' 
                    ? "btn-neon" 
                    : "hover:bg-secondary/50 rounded-2xl"
                  }
                >
                  <Users className="w-4 h-4 mr-2" />
                  Friends
                </Button>
              </div>
            </Card>

            {/* Tab Content */}
            {activeTab === 'chats' ? (
              <Card className="card-cute">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Recent Chats</h2>
                  <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/20 rounded-xl">
                    View All
                  </Button>
                </div>
                <div className="space-y-3">
                  {friends.map((friend, index) => (
                    <div
                      key={friend.name}
                      className="flex items-center gap-3 p-3 hover:bg-secondary/30 rounded-2xl transition-colors cursor-pointer"
                      onClick={() => handleStartChat(friend)}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
                        {friend.name[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{friend.name}</p>
                        <p className="text-sm text-muted-foreground">{friend.lastSeen}</p>
                      </div>
                      <div className="flex gap-2">
                        <div className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-lg">
                          Click to chat & call
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <FriendsTab 
                currentUserId={userInfo.displayName}
                currentUserUniqueId={userInfo.uniqueId}
              />
            )}
          </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User Info */}
          <Card className="card-cute">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-xl mx-auto mb-3">
                {userInfo.displayName[0]}
              </div>
              <h3 className="font-semibold text-lg">{userInfo.displayName}</h3>
              <p className="text-sm text-muted-foreground font-mono bg-secondary/50 rounded-lg px-2 py-1 mt-2">
                ID: {userInfo.uniqueId}
              </p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className="w-2 h-2 rounded-full bg-primary glow-strong"></div>
                <span className="text-sm text-primary font-medium">Online</span>
              </div>
            </div>
          </Card>

          {/* Navigation */}
          <Card className="card-cute">
            <nav className="space-y-2">
              {[
                { icon: MessageSquare, label: "Recent Chats", count: 3, active: activeTab === 'chats' },
                { icon: Users, label: "Friends", count: friends.length, active: activeTab === 'friends' },
                { icon: Phone, label: "Call History", count: 12, active: false }
              ].map((item, index) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  className={`w-full justify-start rounded-2xl text-left ${
                    item.active ? 'bg-primary/20 text-primary' : 'hover:bg-secondary/50'
                  }`}
                  onClick={() => {
                    if (item.label === "Recent Chats") setActiveTab('chats');
                    if (item.label === "Friends") setActiveTab('friends');
                  }}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span className="flex-1">{item.label}</span>
                  {item.count > 0 && (
                    <span className={`text-xs px-2 py-1 rounded-full glow ${
                      item.active ? 'bg-primary text-primary-foreground' : 'bg-primary text-primary-foreground'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </Button>
              ))}
            </nav>
          </Card>
        </div>
        </div>
      </div>
    );
  };

export default MainDashboard;
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { UserPlus, Search, MoreVertical, Edit3, Trash2, Ban, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Friend {
  id: string;
  friend_user_id: string;
  friend_display_name: string;
  friend_unique_id: string;
  nickname?: string;
  status: 'friends' | 'blocked' | 'pending';
  created_at: string;
}

interface FriendsTabProps {
  currentUser: {
    displayName: string;
    uniqueId: string;
  };
  onStartChat: (friend: { name: string; uniqueId: string; lastSeen: string }) => void;
}

const FriendsTab = ({ currentUser, onStartChat }: FriendsTabProps) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [addFriendInput, setAddFriendInput] = useState("");
  const [editingNickname, setEditingNickname] = useState<string | null>(null);
  const [nicknameInput, setNicknameInput] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Get current user's ID
  const getCurrentUserId = async () => {
    const { data } = await supabase
      .from('chat_users')
      .select('id')
      .eq('unique_id', currentUser.uniqueId)
      .single();
    return data?.id;
  };

  // Load friends
  const loadFriends = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;

      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFriends((data || []).map(friend => ({
        ...friend,
        status: friend.status as 'friends' | 'blocked' | 'pending'
      })));
    } catch (error) {
      console.error('Error loading friends:', error);
      toast({
        title: "Error",
        description: "Failed to load friends list",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFriends();
  }, []);

  // Add friend by unique ID
  const addFriend = async () => {
    if (!addFriendInput.trim()) return;

    try {
      const userId = await getCurrentUserId();
      if (!userId) return;

      // Find the friend by unique ID
      const { data: friendData, error: friendError } = await supabase
        .from('chat_users')
        .select('*')
        .eq('unique_id', addFriendInput.trim().toUpperCase())
        .single();

      if (friendError || !friendData) {
        toast({
          title: "User not found",
          description: "No user found with that unique ID",
          variant: "destructive"
        });
        return;
      }

      if (friendData.unique_id === currentUser.uniqueId) {
        toast({
          title: "Cannot add yourself",
          description: "You cannot add yourself as a friend",
          variant: "destructive"
        });
        return;
      }

      // Check if already friends
      const { data: existingFriend } = await supabase
        .from('friends')
        .select('id')
        .eq('user_id', userId)
        .eq('friend_user_id', friendData.id)
        .single();

      if (existingFriend) {
        toast({
          title: "Already friends",
          description: "This user is already in your friends list",
          variant: "destructive"
        });
        return;
      }

      // Add friend
      const { error } = await supabase
        .from('friends')
        .insert([{
          user_id: userId,
          friend_user_id: friendData.id,
          friend_display_name: friendData.display_name,
          friend_unique_id: friendData.unique_id,
          status: 'friends'
        }]);

      if (error) throw error;

      toast({
        title: "Friend added!",
        description: `${friendData.display_name} has been added to your friends list`,
      });

      setAddFriendInput("");
      loadFriends();
    } catch (error) {
      console.error('Error adding friend:', error);
      toast({
        title: "Error",
        description: "Failed to add friend",
        variant: "destructive"
      });
    }
  };

  // Update nickname
  const updateNickname = async (friendId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ nickname: nicknameInput.trim() || null })
        .eq('id', friendId);

      if (error) throw error;

      toast({
        title: "Nickname updated!",
        description: "Friend's nickname has been changed",
      });

      setEditingNickname(null);
      setNicknameInput("");
      loadFriends();
    } catch (error) {
      console.error('Error updating nickname:', error);
      toast({
        title: "Error",
        description: "Failed to update nickname",
        variant: "destructive"
      });
    }
  };

  // Remove friend
  const removeFriend = async (friendId: string, friendName: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', friendId);

      if (error) throw error;

      toast({
        title: "Friend removed",
        description: `${friendName} has been removed from your friends list`,
      });

      loadFriends();
    } catch (error) {
      console.error('Error removing friend:', error);
      toast({
        title: "Error",
        description: "Failed to remove friend",
        variant: "destructive"
      });
    }
  };

  // Block/Unblock friend
  const toggleBlockFriend = async (friendId: string, currentStatus: string, friendName: string) => {
    try {
      const newStatus = currentStatus === 'blocked' ? 'friends' : 'blocked';
      
      const { error } = await supabase
        .from('friends')
        .update({ status: newStatus })
        .eq('id', friendId);

      if (error) throw error;

      toast({
        title: newStatus === 'blocked' ? "Friend blocked" : "Friend unblocked",
        description: `${friendName} has been ${newStatus === 'blocked' ? 'blocked' : 'unblocked'}`,
      });

      loadFriends();
    } catch (error) {
      console.error('Error updating friend status:', error);
      toast({
        title: "Error",
        description: "Failed to update friend status",
        variant: "destructive"
      });
    }
  };

  // Filter friends based on search
  const filteredFriends = friends.filter(friend => {
    const displayName = friend.nickname || friend.friend_display_name;
    return displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           friend.friend_unique_id.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Separate friends by status
  const activeFriends = filteredFriends.filter(f => f.status === 'friends');
  const blockedFriends = filteredFriends.filter(f => f.status === 'blocked');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Friend Section */}
      <Card className="card-cute">
        <h3 className="text-lg font-semibold mb-4">Add Friend</h3>
        <div className="flex gap-2">
          <Input
            placeholder="Enter their unique ID (e.g., CUTE1234567890)"
            value={addFriendInput}
            onChange={(e) => setAddFriendInput(e.target.value)}
            className="flex-1 rounded-2xl border-2 border-border/50 bg-input/50 focus:border-primary focus:glow transition-all"
          />
          <Button
            onClick={addFriend}
            className="btn-neon px-4"
            disabled={!addFriendInput.trim()}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </Card>

      {/* Search Friends */}
      <Card className="card-cute">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 rounded-2xl border-2 border-border/50 bg-input/50 focus:border-primary focus:glow transition-all"
          />
        </div>

        {/* Active Friends */}
        {activeFriends.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium mb-3 text-primary">Friends ({activeFriends.length})</h4>
            <div className="space-y-2">
              {activeFriends.map((friend) => (
                <div key={friend.id} className="flex items-center gap-3 p-3 hover:bg-secondary/30 rounded-2xl transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
                    {(friend.nickname || friend.friend_display_name)[0]}
                  </div>
                  
                  <div className="flex-1">
                    {editingNickname === friend.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={nicknameInput}
                          onChange={(e) => setNicknameInput(e.target.value)}
                          placeholder="Enter nickname..."
                          className="text-sm rounded-xl"
                          onKeyPress={(e) => e.key === 'Enter' && updateNickname(friend.id)}
                        />
                        <Button
                          size="sm"
                          onClick={() => updateNickname(friend.id)}
                          className="px-2 py-1 h-auto"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingNickname(null)}
                          className="px-2 py-1 h-auto"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium">
                          {friend.nickname || friend.friend_display_name}
                          {friend.nickname && (
                            <span className="text-sm text-muted-foreground ml-2">
                              ({friend.friend_display_name})
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground font-mono">
                          {friend.friend_unique_id}
                        </p>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onStartChat({
                        name: friend.nickname || friend.friend_display_name,
                        uniqueId: friend.friend_unique_id,
                        lastSeen: 'Online now'
                      })}
                      className="w-8 h-8 rounded-lg hover:bg-primary/20 text-primary"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingNickname(friend.id);
                        setNicknameInput(friend.nickname || '');
                      }}
                      className="w-8 h-8 rounded-lg hover:bg-secondary"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleBlockFriend(friend.id, friend.status, friend.nickname || friend.friend_display_name)}
                      className="w-8 h-8 rounded-lg hover:bg-destructive/20 text-destructive"
                    >
                      <Ban className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFriend(friend.id, friend.nickname || friend.friend_display_name)}
                      className="w-8 h-8 rounded-lg hover:bg-destructive/20 text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Blocked Friends */}
        {blockedFriends.length > 0 && (
          <div>
            <h4 className="text-md font-medium mb-3 text-destructive">Blocked ({blockedFriends.length})</h4>
            <div className="space-y-2">
              {blockedFriends.map((friend) => (
                <div key={friend.id} className="flex items-center gap-3 p-3 bg-destructive/5 rounded-2xl opacity-60">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold">
                    {(friend.nickname || friend.friend_display_name)[0]}
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-medium text-muted-foreground">
                      {friend.nickname || friend.friend_display_name}
                    </p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {friend.friend_unique_id}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleBlockFriend(friend.id, friend.status, friend.nickname || friend.friend_display_name)}
                      className="text-sm hover:bg-primary/20 text-primary rounded-xl"
                    >
                      Unblock
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFriend(friend.id, friend.nickname || friend.friend_display_name)}
                      className="w-8 h-8 rounded-lg hover:bg-destructive/20 text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredFriends.length === 0 && (
          <div className="text-center py-12">
            <UserPlus className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No friends found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? "No friends match your search" : "Add some friends to get started!"}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default FriendsTab;
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  UserPlus, 
  UserMinus, 
  UserX, 
  Edit3, 
  Check, 
  X, 
  Search,
  MoreVertical
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Friend {
  id: string;
  friend_user_id: string;
  friend_display_name: string;
  friend_unique_id: string;
  nickname: string | null;
  status: 'friends' | 'blocked' | 'pending';
  created_at: string;
}

interface FriendsTabProps {
  currentUserId: string;
  currentUserUniqueId: string;
}

const FriendsTab = ({ currentUserId, currentUserUniqueId }: FriendsTabProps) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [addFriendId, setAddFriendId] = useState("");
  const [editingNickname, setEditingNickname] = useState<string | null>(null);
  const [newNickname, setNewNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Get current user's database ID
  const getCurrentUserDbId = async () => {
    const { data } = await supabase
      .from('chat_users')
      .select('id')
      .eq('unique_id', currentUserUniqueId)
      .single();
    return data?.id;
  };

  const loadFriends = async () => {
    try {
      const userDbId = await getCurrentUserDbId();
      if (!userDbId) return;

      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', userDbId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFriends((data || []) as Friend[]);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  useEffect(() => {
    loadFriends();
  }, [currentUserUniqueId]);

  const addFriend = async () => {
    if (!addFriendId.trim()) return;
    
    setLoading(true);
    try {
      const userDbId = await getCurrentUserDbId();
      if (!userDbId) return;

      // Find friend by unique ID
      const { data: friendData, error: friendError } = await supabase
        .from('chat_users')
        .select('*')
        .eq('unique_id', addFriendId.toUpperCase())
        .single();

      if (friendError || !friendData) {
        toast({
          title: "Friend not found",
          description: "No user found with that unique ID",
          variant: "destructive"
        });
        return;
      }

      if (friendData.id === userDbId) {
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
        .select('*')
        .eq('user_id', userDbId)
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
        .insert({
          user_id: userDbId,
          friend_user_id: friendData.id,
          friend_display_name: friendData.display_name,
          friend_unique_id: friendData.unique_id,
          status: 'friends'
        });

      if (error) throw error;

      toast({
        title: "Friend added!",
        description: `${friendData.display_name} is now your friend`,
      });

      setAddFriendId("");
      loadFriends();
    } catch (error) {
      console.error('Error adding friend:', error);
      toast({
        title: "Error",
        description: "Failed to add friend",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFriendStatus = async (friendId: string, status: 'friends' | 'blocked') => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status })
        .eq('id', friendId);

      if (error) throw error;

      toast({
        title: status === 'blocked' ? "Friend blocked" : "Friend unblocked",
        description: status === 'blocked' ? "User has been blocked" : "User has been unblocked",
      });

      loadFriends();
    } catch (error) {
      console.error('Error updating friend status:', error);
    }
  };

  const removeFriend = async (friendId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', friendId);

      if (error) throw error;

      toast({
        title: "Friend removed",
        description: "User has been removed from your friends list",
      });

      loadFriends();
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  const updateNickname = async (friendId: string, nickname: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ nickname: nickname || null })
        .eq('id', friendId);

      if (error) throw error;

      toast({
        title: "Nickname updated",
        description: "Friend's nickname has been updated",
      });

      setEditingNickname(null);
      loadFriends();
    } catch (error) {
      console.error('Error updating nickname:', error);
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.status === 'friends' &&
    (friend.friend_display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     friend.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     friend.friend_unique_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const blockedFriends = friends.filter(friend => friend.status === 'blocked');

  return (
    <div className="space-y-6">
      {/* Add Friend */}
      <Card className="card-cute">
        <h2 className="text-xl font-semibold mb-4">Add Friend</h2>
        <div className="flex gap-2">
          <Input
            placeholder="Enter friend's unique ID (e.g., CUTE1234567890)"
            value={addFriendId}
            onChange={(e) => setAddFriendId(e.target.value.toUpperCase())}
            className="flex-1 rounded-2xl border-2 border-border/50 bg-input/50 focus:border-primary focus:glow transition-all"
          />
          <Button
            onClick={addFriend}
            disabled={loading || !addFriendId.trim()}
            className="btn-neon px-4"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          💡 Ask your friends for their unique ID to add them!
        </p>
      </Card>

      {/* Search Friends */}
      <Card className="card-cute">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search friends..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-2xl border-2 border-border/50 bg-input/50 focus:border-primary focus:glow transition-all"
          />
        </div>

        {/* Friends List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Friends ({filteredFriends.length})</h3>
          {filteredFriends.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserPlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No friends yet. Add some using their unique ID!</p>
            </div>
          ) : (
            filteredFriends.map((friend) => (
              <div key={friend.id} className="flex items-center gap-3 p-3 hover:bg-secondary/30 rounded-2xl transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
                  {(friend.nickname || friend.friend_display_name)[0]}
                </div>
                <div className="flex-1">
                  {editingNickname === friend.id ? (
                    <div className="flex gap-2">
                      <Input
                        value={newNickname}
                        onChange={(e) => setNewNickname(e.target.value)}
                        placeholder="Enter nickname"
                        className="text-sm rounded-xl"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => updateNickname(friend.id, newNickname)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setEditingNickname(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="font-medium">
                        {friend.nickname || friend.friend_display_name}
                        {friend.nickname && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({friend.friend_display_name})
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        ID: {friend.friend_unique_id}
                      </p>
                    </>
                  )}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingNickname(friend.id);
                        setNewNickname(friend.nickname || "");
                      }}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Nickname
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => updateFriendStatus(friend.id, 'blocked')}
                      className="text-yellow-600"
                    >
                      <UserX className="w-4 h-4 mr-2" />
                      Block
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => removeFriend(friend.id)}
                      className="text-destructive"
                    >
                      <UserMinus className="w-4 h-4 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>

        {/* Blocked Users */}
        {blockedFriends.length > 0 && (
          <div className="space-y-3 mt-6 pt-6 border-t border-border/30">
            <h3 className="font-semibold text-foreground">Blocked ({blockedFriends.length})</h3>
            {blockedFriends.map((friend) => (
              <div key={friend.id} className="flex items-center gap-3 p-3 bg-destructive/10 rounded-2xl">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold">
                  {friend.friend_display_name[0]}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-muted-foreground">
                    {friend.nickname || friend.friend_display_name}
                  </p>
                  <p className="text-xs text-muted-foreground">Blocked</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => updateFriendStatus(friend.id, 'friends')}
                    className="text-xs"
                  >
                    Unblock
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFriend(friend.id)}
                    className="text-xs text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default FriendsTab;
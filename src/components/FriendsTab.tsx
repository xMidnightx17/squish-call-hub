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
  const [editingNickname, setEditingNickname] = useState<string | null>(null);
  const [newNickname, setNewNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Get current user's database ID
  const getCurrentUserDbId = async () => {
    console.log('Getting user DB ID for unique_id:', currentUserUniqueId);
    const { data, error } = await supabase
      .from('chat_users')
      .select('id')
      .eq('unique_id', currentUserUniqueId)
      .single();
    
    console.log('getCurrentUserDbId result:', { data, error });
    return data?.id;
  };

  const loadFriends = async () => {
    try {
      console.log('🔄 Loading friends for user:', currentUserUniqueId);
      const userDbId = await getCurrentUserDbId();
      console.log('📊 User DB ID:', userDbId);
      
      if (!userDbId) {
        console.log('❌ No user DB ID found - cannot load friends');
        setFriends([]);
        return;
      }

      // Query friends with comprehensive error handling
      console.log('🔍 Querying friends table...');
      const { data, error } = await supabase
        .from('friends')
        .select(`
          id,
          friend_user_id,
          friend_display_name,
          friend_unique_id,
          nickname,
          status,
          created_at
        `)
        .eq('user_id', userDbId)
        .order('created_at', { ascending: false });

      console.log('👥 Friends query result:', { 
        data: data?.length || 0, 
        error: error?.message || 'none' 
      });

      if (error) {
        console.error('❌ Error loading friends:', error);
        
        // Handle specific RLS policy errors
        if (error.code === '42501' || error.message.includes('policy')) {
          console.log('🔒 RLS policy error detected - trying direct query');
          
          // Since we can't use RPC without the migration, let's try a direct query
          // This is a temporary workaround for the RLS policy issue
          toast({
            title: "Friends List Issue",
            description: "There may be a database permission issue. Some features might not work correctly.",
            variant: "destructive"
          });
          setFriends([]);
          return;
        }
        
        // Other database errors
        toast({
          title: "Error Loading Friends",
          description: "Unable to load friends list. Please try refreshing.",
          variant: "destructive"
        });
        return;
      }

      // Success!
      const friendsList = (data || []) as Friend[];
      console.log('✅ Successfully loaded friends:', friendsList.length);
      setFriends(friendsList);
      
      if (friendsList.length === 0) {
        console.log('📝 No friends found for user');
      }

    } catch (error) {
      console.error('❌ Unexpected error loading friends:', error);
      toast({
        title: "Unexpected Error",
        description: "Failed to load friends: " + (error as Error).message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadFriends();
  }, [currentUserUniqueId]);

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

  const removeFriend = async (friendId: string, friendName: string) => {
    try {
      console.log('🗑️ Removing friend:', friendId, friendName);
      
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', friendId);

      console.log('🗑️ Remove friend result:', { error });

      if (error) {
        console.error('❌ Error removing friend:', error);
        toast({
          title: "Error Removing Friend",
          description: `Failed to remove ${friendName}: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Friend removed successfully');
      toast({
        title: "Friend Removed",
        description: `${friendName} has been removed from your friends list`,
      });

      await loadFriends(); // Reload the friends list
    } catch (error) {
      console.error('❌ Unexpected error removing friend:', error);
      toast({
        title: "Unexpected Error",
        description: "Failed to remove friend: " + (error as Error).message,
        variant: "destructive"
      });
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
    <div className="flex flex-col h-full max-h-[calc(100vh-12rem)]">
      {/* Search & Friends List - Full height */}
      <Card className="card-cute flex-1 flex flex-col min-h-0">
        {/* Search bar - Fixed */}
        <div className="flex items-center gap-4 mb-4 flex-shrink-0">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search friends..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-xl border-2 border-border/50 bg-input/50 focus:border-primary focus:glow transition-all py-2"
          />
        </div>

        {/* Friends List - Scrollable container */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground sticky top-0 bg-card z-10 py-2">
              Friends ({filteredFriends.length})
            </h3>
            
            {filteredFriends.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground flex flex-col justify-center min-h-[300px]">
                <UserPlus className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No friends yet</p>
                <p>Add some using their unique ID!</p>
              </div>
            ) : (
              <div className="space-y-3 pb-4">
                {filteredFriends.map((friend) => (
                  <div key={friend.id} className="flex items-center gap-4 p-4 hover:bg-secondary/30 rounded-xl transition-colors border border-border/30">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-xl">
                      {(friend.nickname || friend.friend_display_name)[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingNickname === friend.id ? (
                        <div className="flex gap-3">
                          <Input
                            value={newNickname}
                            onChange={(e) => setNewNickname(e.target.value)}
                            placeholder="Enter nickname"
                            className="text-lg rounded-xl py-3"
                            autoFocus
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-12 w-12"
                            onClick={() => updateNickname(friend.id, newNickname)}
                          >
                            <Check className="w-5 h-5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-12 w-12"
                            onClick={() => setEditingNickname(null)}
                          >
                            <X className="w-5 h-5" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <p className="font-semibold text-lg">
                            {friend.nickname || friend.friend_display_name}
                            {friend.nickname && (
                              <span className="text-sm text-muted-foreground ml-3">
                                ({friend.friend_display_name})
                              </span>
                            )}
                          </p>
                          <p className="text-muted-foreground font-mono text-sm">
                            ID: {friend.friend_unique_id}
                          </p>
                        </>
                      )}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingNickname(friend.id);
                            setNewNickname(friend.nickname || "");
                          }}
                        >
                          <Edit3 className="w-5 h-5 mr-2" />
                          Edit Nickname
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updateFriendStatus(friend.id, 'blocked')}
                          className="text-yellow-600"
                        >
                          <UserX className="w-5 h-5 mr-2" />
                          Block
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => removeFriend(friend.id, friend.nickname || friend.friend_display_name)}
                          className="text-destructive"
                        >
                          <UserMinus className="w-5 h-5 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}

            {/* Blocked Users */}
            {blockedFriends.length > 0 && (
              <div className="space-y-3 mt-6 pt-4 border-t border-border/30">
                <h3 className="text-lg font-semibold text-foreground sticky top-0 bg-card z-10 py-2">
                  Blocked ({blockedFriends.length})
                </h3>
                {blockedFriends.map((friend) => (
                  <div key={friend.id} className="flex items-center gap-4 p-3 bg-destructive/10 rounded-xl border border-destructive/20">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold">
                      {friend.friend_display_name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-muted-foreground">
                        {friend.nickname || friend.friend_display_name}
                      </p>
                      <p className="text-muted-foreground text-sm">Blocked</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateFriendStatus(friend.id, 'friends')}
                        className="px-3 py-1 text-sm"
                      >
                        Unblock
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFriend(friend.id, friend.nickname || friend.friend_display_name)}
                        className="px-3 py-1 text-sm text-destructive"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FriendsTab;
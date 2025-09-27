import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Check, X, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SearchResult {
  id: string;
  display_name: string;
  avatar_url: string;
  is_friend: boolean;
  friend_status: string;
}

interface Friend {
  friend_id: string;
  display_name: string;
  avatar_url: string;
  status: string;
  last_active: string;
}

const FriendsSearch = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);

  // Load friends list
  useEffect(() => {
    if (!user) return;
    
    const loadFriends = async () => {
      try {
        const { data, error } = await supabase.rpc('get_user_friends');
        if (error) throw error;
        setFriends(data || []);
      } catch (error) {
        console.error("Error loading friends:", error);
      }
    };

    loadFriends();

  // Set up real-time updates for friends
  const friendsChannel = supabase
    .channel('friends-updates')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'friends'
    }, () => {
      loadFriends();
    })
    .subscribe();

    return () => {
      supabase.removeChannel(friendsChannel);
    };
  }, [user]);

  // Search users
  const handleSearch = async () => {
    if (!searchTerm.trim() || !user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('search_users_by_name', {
        search_term: searchTerm
      });
      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Error searching users");
    } finally {
      setLoading(false);
    }
  };

  // Send friend request
  const sendFriendRequest = async (friendId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('friends')
        .insert({
          user_id: user.id,
          friend_id: friendId,
          status: 'pending'
        });
      
      if (error) throw error;
      toast.success("Friend request sent!");
      handleSearch(); // Refresh results
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("Error sending friend request");
    }
  };

  // Accept friend request
  const acceptFriendRequest = async (friendId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('user_id', friendId)
        .eq('friend_id', user.id)
        .eq('status', 'pending');
      
      if (error) throw error;
      toast.success("Friend request accepted!");
      handleSearch(); // Refresh results
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error("Error accepting friend request");
    }
  };

  // Decline friend request
  const declineFriendRequest = async (friendId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('user_id', friendId)
        .eq('friend_id', user.id)
        .eq('status', 'pending');
      
      if (error) throw error;
      toast.success("Friend request declined");
      handleSearch(); // Refresh results
    } catch (error) {
      console.error("Error declining friend request:", error);
      toast.error("Error declining friend request");
    }
  };

  // Start chat with friend
  const startChat = async (friendId: string) => {
    if (!user) return;
    
    try {
      // Check if chat room already exists
      const { data: existingRoom } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('is_group', false)
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${user.id})`)
        .single();

      if (existingRoom) {
        window.location.href = `/messages?room=${existingRoom.id}`;
        return;
      }

      // Create new chat room
      const { data: newRoom, error } = await supabase
        .from('chat_rooms')
        .insert({
          user1_id: user.id,
          user2_id: friendId,
          is_group: false
        })
        .select('id')
        .single();

      if (error) throw error;
      window.location.href = `/messages?room=${newRoom.id}`;
    } catch (error) {
      console.error("Error starting chat:", error);
      toast.error("Error starting chat");
    }
  };

  const renderActionButton = (result: SearchResult) => {
    if (result.friend_status === 'accepted') {
      return (
        <Button size="sm" onClick={() => startChat(result.id)}>
          <MessageCircle className="mr-2 h-4 w-4" />
          Chat
        </Button>
      );
    }
    
    if (result.friend_status === 'pending') {
      // Check if current user sent the request
      return (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => acceptFriendRequest(result.id)}>
            <Check className="mr-2 h-4 w-4" />
            Accept
          </Button>
          <Button size="sm" variant="outline" onClick={() => declineFriendRequest(result.id)}>
            <X className="mr-2 h-4 w-4" />
            Decline
          </Button>
        </div>
      );
    }
    
    return (
      <Button size="sm" onClick={() => sendFriendRequest(result.id)}>
        <UserPlus className="mr-2 h-4 w-4" />
        Add Friend
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Friends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-3">
              {searchResults.map((result) => (
                <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={result.avatar_url} />
                      <AvatarFallback>
                        {result.display_name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{result.display_name}</div>
                      {result.friend_status !== 'none' && (
                        <Badge variant="secondary" className="text-xs">
                          {result.friend_status}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {renderActionButton(result)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Friends List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Friends ({friends.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {friends.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No friends yet. Search for people to add them!
            </p>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => (
                <div key={friend.friend_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={friend.avatar_url} />
                      <AvatarFallback>
                        {friend.display_name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{friend.display_name}</div>
                      <div className="text-xs text-muted-foreground">
                        Last active: {new Date(friend.last_active).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => startChat(friend.friend_id)}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Chat
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FriendsSearch;
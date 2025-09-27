import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Search, UserPlus, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Friend {
  friend_id: string;
  display_name: string;
  avatar_url?: string;
  status: string;
  last_active: string;
}

interface SearchResult {
  id: string;
  display_name: string;
  avatar_url?: string;
  is_friend: boolean;
  friend_status: string;
}

export default function FriendsModal({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const loadFriends = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('get_user_friends');
      if (error) throw error;
      setFriends(data || []);
    } catch (error) {
      console.error("Error loading friends:", error);
    }
  };

  const searchUsers = async (term: string) => {
    if (!term.trim() || !user) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('search_users_by_name', { search_term: term });
      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Failed to search users");
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('friends')
        .insert([{
          user_id: user.id,
          friend_id: friendId,
          status: 'pending'
        }]);

      if (error) throw error;
      
      toast.success("Friend request sent!");
      searchUsers(searchTerm); // Refresh search results
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("Failed to send friend request");
    }
  };

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
      loadFriends();
      searchUsers(searchTerm);
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error("Failed to accept friend request");
    }
  };

  const createDirectChat = async (friendId: string) => {
    if (!user) return;

    try {
      // Check if chat already exists
      const { data: existingChat } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('is_group', false)
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${user.id})`)
        .single();

      if (existingChat) {
        window.location.href = `/messages?room=${existingChat.id}`;
        return;
      }

      // Create new chat
      const { data: newChat, error } = await supabase
        .from('chat_rooms')
        .insert([{
          user1_id: user.id,
          user2_id: friendId,
          is_group: false
        }])
        .select('id')
        .single();

      if (error) throw error;
      
      window.location.href = `/messages?room=${newChat.id}`;
    } catch (error) {
      console.error("Error creating chat:", error);
      toast.error("Failed to start chat");
    }
  };

  useEffect(() => {
    loadFriends();
  }, [user]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Friends
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="friends">My Friends</TabsTrigger>
            <TabsTrigger value="search">Find Friends</TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-4">
            <div className="max-h-80 overflow-y-auto space-y-3">
              {friends.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No friends yet</p>
                  <p className="text-sm">Search for friends to get started!</p>
                </div>
              ) : (
                friends.map((friend) => (
                  <div key={friend.friend_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={friend.avatar_url || ""} />
                        <AvatarFallback>
                          {friend.display_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{friend.display_name}</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => createDirectChat(friend.friend_id)}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : searchResults.length === 0 && searchTerm ? (
                <div className="text-center text-muted-foreground py-4">
                  No users found
                </div>
              ) : (
                searchResults.map((result) => (
                  <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={result.avatar_url || ""} />
                        <AvatarFallback>
                          {result.display_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-medium">{result.display_name}</span>
                        {result.friend_status === 'pending' && (
                          <Badge variant="secondary" className="ml-2 text-xs">Pending</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {result.friend_status === 'none' && (
                        <Button 
                          size="sm" 
                          onClick={() => sendFriendRequest(result.id)}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      )}
                      {result.friend_status === 'pending' && (
                        <Button 
                          size="sm" 
                          onClick={() => acceptFriendRequest(result.id)}
                        >
                          Accept
                        </Button>
                      )}
                      {result.friend_status === 'accepted' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => createDirectChat(result.id)}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
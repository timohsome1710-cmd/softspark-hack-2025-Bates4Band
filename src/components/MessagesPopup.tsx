import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Users, UserPlus, Search, Check, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ChatConversation from "@/components/ChatConversation";

interface Friend {
  friend_id: string;
  display_name: string;
  avatar_url: string;
  status: string;
  last_active: string;
}

interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string;
  profiles: {
    display_name: string;
    avatar_url?: string;
  };
}

interface SearchUser {
  id: string;
  display_name: string;
  avatar_url?: string;
  is_friend: boolean;
  friend_status: string;
}

const MessagesPopup = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [activeTab, setActiveTab] = useState("friends");
  const [open, setOpen] = useState(false);

  const getInitials = (name: string) => {
    return name?.split(' ').map(word => word[0]?.toUpperCase()).join('').slice(0, 2) || 'U';
  };

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

  const loadFriendRequests = async () => {
    if (!user) return;
    try {
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select('*')
        .eq('friend_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (friendsError) throw friendsError;

      if (!friendsData || friendsData.length === 0) {
        setFriendRequests([]);
        return;
      }

      const userIds = friendsData.map(f => f.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const requestsWithProfiles = friendsData.map(friend => {
        const profile = profilesData?.find(p => p.id === friend.user_id);
        return {
          ...friend,
          profiles: {
            display_name: profile?.display_name || 'Unknown User',
            avatar_url: profile?.avatar_url || null,
          }
        };
      });

      setFriendRequests(requestsWithProfiles);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const searchUsers = async (term: string) => {
    if (!user || !term.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('search_users_by_name', {
        search_term: term.trim()
      });

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const sendFriendRequest = async (targetUserId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('friends')
        .insert([{
          user_id: user.id,
          friend_id: targetUserId,
          status: 'pending'
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Friend request sent!",
      });

      await searchUsers(searchTerm);
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      });
    }
  };

  const handleFriendRequest = async (requestId: string, senderId: string, action: 'accept' | 'decline') => {
    try {
      if (action === 'accept') {
        const { error } = await supabase
          .from('friends')
          .update({ status: 'accepted' })
          .eq('user_id', senderId)
          .eq('friend_id', user?.id)
          .eq('status', 'pending');

        if (error) throw error;
        toast({ title: "Success", description: "Friend request accepted!" });
      } else {
        const { error } = await supabase
          .from('friends')
          .delete()
          .eq('user_id', senderId)
          .eq('friend_id', user?.id)
          .eq('status', 'pending');

        if (error) throw error;
        toast({ title: "Success", description: "Friend request declined" });
      }

      await loadFriendRequests();
      await loadFriends();
    } catch (error) {
      console.error(`Error ${action}ing friend request:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} friend request`,
        variant: "destructive",
      });
    }
  };

  const startChat = async (friend: Friend) => {
    try {
      const { data: existingRoom } = await supabase
        .from("chat_rooms")
        .select("id")
        .eq("is_group", false)
        .or(`and(user1_id.eq.${user?.id},user2_id.eq.${friend.friend_id}),and(user1_id.eq.${friend.friend_id},user2_id.eq.${user?.id})`)
        .maybeSingle();

      if (!existingRoom) {
        const { data: newRoom, error } = await supabase
          .from("chat_rooms")
          .insert([{
            user1_id: user?.id,
            user2_id: friend.friend_id,
            is_group: false,
          }])
          .select("id")
          .single();

        if (error) throw error;
      }

      setSelectedFriend(friend);
    } catch (error) {
      console.error("Error starting chat:", error);
      toast({
        title: "Error",
        description: "Failed to start chat",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (open && user) {
      loadFriends();
      loadFriendRequests();
    }
  }, [open, user]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchUsers(searchTerm);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, user]);

  if (selectedFriend) {
    return (
      <Dialog open={open} onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) setSelectedFriend(null);
      }}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-w-5xl h-[85vh] p-0">
          <div className="h-full">
            <ChatConversation 
              friend={selectedFriend} 
              onBack={() => setSelectedFriend(null)} 
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl h-[80vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Messages & Friends
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 px-6 pb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="friends" className="text-sm">
                <Users className="h-4 w-4 mr-1" />
                Friends ({friends.length})
              </TabsTrigger>
              <TabsTrigger value="requests" className="text-sm">
                <UserPlus className="h-4 w-4 mr-1" />
                Requests ({friendRequests.length})
              </TabsTrigger>
              <TabsTrigger value="search" className="text-sm">
                <Search className="h-4 w-4 mr-1" />
                Find Friends
              </TabsTrigger>
            </TabsList>

            <div className="h-[calc(100%-3rem)]">
              <TabsContent value="friends" className="h-full mt-0">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-base">Your Friends</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-4rem)] overflow-y-auto">
                    {friends.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>No friends yet. Search for friends to get started!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {friends.map((friend) => (
                          <div
                            key={friend.friend_id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={friend.avatar_url || ""} alt={friend.display_name} />
                                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 font-bold text-sm">
                                  {getInitials(friend.display_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-sm">{friend.display_name}</div>
                                <div className="text-xs text-muted-foreground">
                                  Last active: {new Date(friend.last_active).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => startChat(friend)}
                              className="bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                            >
                              <MessageCircle className="h-4 w-4 mr-1" />
                              Chat
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="requests" className="h-full mt-0">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-base">Friend Requests</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-4rem)] overflow-y-auto">
                    {friendRequests.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>No pending friend requests</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {friendRequests.map((request) => (
                          <div
                            key={request.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={request.profiles?.avatar_url || ""} alt={request.profiles?.display_name} />
                                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 font-bold text-sm">
                                  {getInitials(request.profiles?.display_name || '')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-sm">{request.profiles?.display_name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(request.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleFriendRequest(request.id, request.user_id, 'accept')}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                variant="outline"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleFriendRequest(request.id, request.user_id, 'decline')}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                variant="outline"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="search" className="h-full mt-0">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-base">Find Friends</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-4rem)]">
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      <div className="h-[calc(100%-3rem)] overflow-y-auto">
                        {searchResults.length === 0 && searchTerm ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p>No users found matching "{searchTerm}"</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {searchResults.map((user) => (
                              <div
                                key={user.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                              >
                                <div className="flex items-center space-x-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={user.avatar_url || ""} alt={user.display_name} />
                                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 font-bold text-sm">
                                      {getInitials(user.display_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium text-sm">{user.display_name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {user.is_friend 
                                        ? user.friend_status === 'accepted' ? 'Already friends' 
                                        : user.friend_status === 'pending' ? 'Request sent' 
                                        : 'Not friends'
                                        : 'Not friends'
                                      }
                                    </div>
                                  </div>
                                </div>
                                {!user.is_friend && (
                                  <Button
                                    size="sm"
                                    onClick={() => sendFriendRequest(user.id)}
                                    className="bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                                  >
                                    <UserPlus className="h-4 w-4 mr-1" />
                                    Add Friend
                                  </Button>
                                )}
                                {user.is_friend && user.friend_status === 'accepted' && (
                                  <Button
                                    size="sm"
                                    onClick={() => startChat({ 
                                      friend_id: user.id, 
                                      display_name: user.display_name, 
                                      avatar_url: user.avatar_url || '', 
                                      status: 'accepted', 
                                      last_active: new Date().toISOString() 
                                    } as Friend)}
                                    variant="outline"
                                  >
                                    <MessageCircle className="h-4 w-4 mr-1" />
                                    Chat
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessagesPopup;
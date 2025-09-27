import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Users, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import FriendsSearch from "@/components/FriendsSearch";
import FriendsList from "@/components/FriendsList";
import ChatConversation from "@/components/ChatConversation";

interface Friend {
  friend_id: string;
  display_name: string;
  avatar_url: string;
  status: string;
  last_active: string;
}

interface ChatRoom {
  id: string;
  is_group: boolean;
  group_name?: string;
  user1_id?: string;
  user2_id?: string;
  friend?: Friend;
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
}

const Messages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadFriends = async () => {
      try {
        const { data, error } = await supabase.rpc('get_user_friends');
        
        if (error) throw error;
        setFriends(data || []);
      } catch (error) {
        console.error("Error loading friends:", error);
        toast({
          title: "Error",
          description: "Failed to load friends",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadFriends();

    // Set up real-time subscription for friends updates
    const channel = supabase
      .channel('friends-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friends',
        },
        () => {
          loadFriends();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getInitials = (name: string) => {
    return name?.split(' ').map(word => word[0]?.toUpperCase()).join('').slice(0, 2) || 'U';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Tabs defaultValue="chats" className="w-full h-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="chats">Chats</TabsTrigger>
                <TabsTrigger value="friends">Friends</TabsTrigger>
                <TabsTrigger value="search">
                  <UserPlus className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="chats" className="h-full mt-4">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Chats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-5rem)] overflow-y-auto">
                    {loading ? (
                      <div className="text-center py-4">Loading chats...</div>
                    ) : friends.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No friends to chat with yet</p>
                        <p className="text-sm">Add friends to start chatting!</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {friends.map((friend) => (
                          <Button
                            key={friend.friend_id}
                            variant={selectedFriend?.friend_id === friend.friend_id ? "secondary" : "ghost"}
                            className="w-full justify-start p-3 h-auto"
                            onClick={() => setSelectedFriend(friend)}
                          >
                            <Avatar className="h-12 w-12 mr-3 border-2 border-border">
                              <AvatarImage src={friend.avatar_url || ""} alt={friend.display_name} />
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 font-bold">
                                {getInitials(friend.display_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-left">
                              <div className="font-medium">{friend.display_name}</div>
                              <div className="text-sm text-muted-foreground">Online</div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="friends" className="h-full mt-4">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Friends
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-5rem)] overflow-y-auto">
                    <FriendsList />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="search" className="h-full mt-4">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      Add Friends
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-5rem)] overflow-y-auto">
                    <FriendsSearch />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3 h-full">
            {selectedFriend ? (
              <ChatConversation 
                friend={selectedFriend} 
                onBack={() => setSelectedFriend(null)} 
              />
            ) : (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-semibold">Select a chat to start messaging</p>
                  <p className="text-muted-foreground">
                    Choose from your existing conversations or start a new one with friends
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
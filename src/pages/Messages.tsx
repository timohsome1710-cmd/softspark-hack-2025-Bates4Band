import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Users, UserPlus, Home } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import FriendsSearch from "@/components/FriendsSearch";
import FriendsList from "@/components/FriendsList";
import ChatConversation from "@/components/ChatConversation";
import FriendRequests from "@/components/FriendRequests";

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
  const navigate = useNavigate();
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
      
      {/* Back to Home Button */}
      <div className="container mx-auto px-4 pt-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-4 text-muted-foreground hover:text-foreground"
        >
          <Home className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </div>

      <div className="container mx-auto px-4 pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Messages</h1>
          <p className="text-muted-foreground text-sm">Connect and chat with your friends</p>
        </div>
        <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-16rem)]">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Tabs defaultValue="chats" className="w-full h-full">
              <TabsList className="grid w-full grid-cols-4 mb-3">
                <TabsTrigger value="chats" className="text-xs font-medium">Chats</TabsTrigger>
                <TabsTrigger value="friends" className="text-xs font-medium">Friends</TabsTrigger>
                <TabsTrigger value="requests" className="text-xs font-medium">Requests</TabsTrigger>
                <TabsTrigger value="search" className="text-xs font-medium">
                  <UserPlus className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="chats" className="h-[calc(100%-3rem)] mt-0">
                <Card className="h-full border">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MessageCircle className="h-4 w-4 text-primary" />
                      Your Chats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-4rem)] overflow-y-auto p-3">
                    {loading ? (
                      <div className="text-center py-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-3"></div>
                        <div className="text-sm text-muted-foreground">Loading chats...</div>
                      </div>
                    ) : friends.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <h3 className="font-semibold text-base mb-2">No friends to chat with yet</h3>
                        <p className="text-sm">Add friends to start chatting!</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {friends.map((friend) => (
                          <Button
                            key={friend.friend_id}
                            variant={selectedFriend?.friend_id === friend.friend_id ? "secondary" : "ghost"}
                            className={`w-full justify-start p-3 h-auto rounded-lg transition-all hover:shadow-sm ${
                              selectedFriend?.friend_id === friend.friend_id 
                                ? "bg-primary/10 border border-primary/20" 
                                : "hover:bg-accent/50"
                            }`}
                            onClick={() => setSelectedFriend(friend)}
                          >
                            <Avatar className="h-10 w-10 mr-3 border border-border">
                              <AvatarImage src={friend.avatar_url || ""} alt={friend.display_name} />
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 font-bold text-sm">
                                {getInitials(friend.display_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-left">
                              <div className="font-medium text-sm mb-1">{friend.display_name}</div>
                              <div className="text-xs text-muted-foreground">Click to start chatting</div>
                            </div>
                            <div className="flex flex-col items-end">
                              <div className="w-2 h-2 bg-green-500 rounded-full mb-1"></div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="friends" className="h-[calc(100%-3rem)] mt-0">
                <Card className="h-full border">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users className="h-4 w-4 text-primary" />
                      Your Friends
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-4rem)] overflow-y-auto p-3">
                    <FriendsList />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="requests" className="h-[calc(100%-3rem)] mt-0">
                <Card className="h-full border">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users className="h-4 w-4 text-primary" />
                      Friend Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-4rem)] overflow-y-auto p-3">
                    <FriendRequests />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="search" className="h-[calc(100%-3rem)] mt-0">
                <Card className="h-full border">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <UserPlus className="h-4 w-4 text-primary" />
                      Add New Friends
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-4rem)] overflow-y-auto p-3">
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
              <Card className="h-full flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                <div className="text-center max-w-md">
                  <MessageCircle className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
                  <h2 className="text-lg font-semibold mb-2">Welcome to Messages</h2>
                  <p className="text-muted-foreground mb-4 text-sm">
                    Select a friend from your chat list to start messaging, or add new friends to expand your network!
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const tabElements = document.querySelectorAll('[role="tab"]');
                        const friendsTab = Array.from(tabElements).find(tab => tab.textContent?.includes('Friends'));
                        (friendsTab as HTMLElement)?.click();
                      }}
                    >
                      View Friends
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => {
                        const tabElements = document.querySelectorAll('[role="tab"]');
                        const searchTab = Array.from(tabElements).find(tab => tab.querySelector('[data-testid="user-plus-icon"], .lucide-user-plus'));
                        (searchTab as HTMLElement)?.click();
                      }}
                    >
                      Add Friends
                    </Button>
                  </div>
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
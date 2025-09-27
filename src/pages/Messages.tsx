import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Send, Users, UserPlus, Home, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import FriendsSearch from "@/components/FriendsSearch";
import FriendsList from "@/components/FriendsList";

interface ChatRoom {
  id: string;
  is_group: boolean;
  group_name?: string;
  user1_id?: string;
  user2_id?: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

const Messages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadChatRooms = async () => {
      try {
        const { data, error } = await supabase
          .from("chat_rooms")
          .select("*")
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .order("updated_at", { ascending: false });

        if (error) throw error;
        setChatRooms(data || []);
      } catch (error) {
        console.error("Error loading chat rooms:", error);
      } finally {
        setLoading(false);
      }
    };

    loadChatRooms();
  }, [user]);

  useEffect(() => {
    if (!selectedRoom || !user) return;

    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("chat_room_id", selectedRoom.id)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    };

    loadMessages();

    // Set up real-time subscription
    const channel = supabase
      .channel(`room-${selectedRoom.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_room_id=eq.${selectedRoom.id}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedRoom, user]);

  const sendMessage = async () => {
    if (!selectedRoom || !user || !newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          chat_room_id: selectedRoom.id,
          sender_id: user.id,
          content: newMessage.trim(),
        });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Tabs defaultValue="chats" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="chats">Chats</TabsTrigger>
                <TabsTrigger value="friends">Friends</TabsTrigger>
                <TabsTrigger value="search">
                  <UserPlus className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="chats">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Chats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-4">Loading chats...</div>
                    ) : chatRooms.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No chats yet
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {chatRooms.map((room) => (
                          <Button
                            key={room.id}
                            variant={selectedRoom?.id === room.id ? "default" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => setSelectedRoom(room)}
                          >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            {room.is_group ? room.group_name : "Direct Chat"}
                          </Button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="friends">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Friends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FriendsList />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="search">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      Add Friends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FriendsSearch />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            {selectedRoom ? (
              <Card className="h-[600px] flex flex-col">
                <CardHeader>
                  <CardTitle>
                    {selectedRoom.is_group ? selectedRoom.group_name : "Direct Chat"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender_id === user?.id ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender_id === user?.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p>{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          sendMessage();
                        }
                      }}
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-[600px] flex items-center justify-center">
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
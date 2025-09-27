import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft, Phone, Video, MoreVertical, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

interface Friend {
  friend_id: string;
  display_name: string;
  avatar_url: string;
}

interface ChatConversationProps {
  friend: Friend;
  onBack: () => void;
}

const ChatConversation = ({ friend, onBack }: ChatConversationProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user || !friend) return;

    const initializeChat = async () => {
      try {
        // Check if a direct chat already exists
        const { data: existingRoom } = await supabase
          .from("chat_rooms")
          .select("id")
          .eq("is_group", false)
          .or(`and(user1_id.eq.${user.id},user2_id.eq.${friend.friend_id}),and(user1_id.eq.${friend.friend_id},user2_id.eq.${user.id})`)
          .maybeSingle();

        let roomId = existingRoom?.id;

        if (!existingRoom) {
          // Create new direct chat
          const { data: newRoom, error } = await supabase
            .from("chat_rooms")
            .insert([{
              user1_id: user.id,
              user2_id: friend.friend_id,
              is_group: false
            }])
            .select("id")
            .single();

          if (error) throw error;
          roomId = newRoom.id;
        }

        setChatRoomId(roomId);

        // Load messages
        const { data: messagesData, error: messagesError } = await supabase
          .from("messages")
          .select("*")
          .eq("chat_room_id", roomId)
          .order("created_at", { ascending: true });

        if (messagesError) throw messagesError;
        setMessages(messagesData || []);

      } catch (error) {
        console.error("Error initializing chat:", error);
        toast({
          title: "Error",
          description: "Failed to load chat",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    initializeChat();
  }, [user, friend]);

  useEffect(() => {
    if (!chatRoomId) return;

    // Set up real-time subscription
    const channel = supabase
      .channel(`room-${chatRoomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_room_id=eq.${chatRoomId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatRoomId]);

  const sendMessage = async () => {
    if (!chatRoomId || !user || !newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          chat_room_id: chatRoomId,
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground">Loading conversation...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col border-2 shadow-lg">
      {/* Header */}
      <CardHeader className="flex flex-row items-center space-y-0 pb-4 border-b-2 bg-gradient-to-r from-primary/5 to-secondary/5">
        <Button variant="ghost" size="icon" onClick={onBack} className="mr-3 hover:bg-primary/10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <Avatar className="h-12 w-12 mr-4 border-2 border-primary/20">
          <AvatarImage src={friend.avatar_url || ""} alt={friend.display_name} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 font-bold">
            {friend.display_name?.split(' ').map(word => word[0]?.toUpperCase()).join('').slice(0, 2) || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <CardTitle className="text-xl mb-1">{friend.display_name}</CardTitle>
          <div className="flex items-center text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Online
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="hover:bg-primary/10">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hover:bg-primary/10">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hover:bg-primary/10">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-background to-muted/20">
          {messages.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
              <p>Start the conversation with {friend.display_name}!</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwnMessage = message.sender_id === user?.id;
              const showTime = index === 0 || 
                new Date(message.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 300000;

              return (
                <div key={message.id}>
                  {showTime && (
                    <div className="text-center text-xs text-muted-foreground my-6 px-4 py-2 bg-muted/50 rounded-full inline-block">
                      {new Date(message.created_at).toLocaleDateString()} {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm ${
                        isOwnMessage
                          ? "bg-primary text-primary-foreground rounded-br-md ml-12"
                          : "bg-white border border-border rounded-bl-md mr-12"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
                      <p className="text-xs opacity-70 mt-2 text-right">
                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t-2 bg-background">
          <div className="flex gap-3 items-end">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${friend.display_name}...`}
              onKeyDown={handleKeyPress}
              className="flex-1 rounded-xl border-2 px-4 py-3 text-sm resize-none min-h-[2.5rem] max-h-32"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!newMessage.trim()}
              size="icon"
              className="rounded-xl h-12 w-12 flex-shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatConversation;
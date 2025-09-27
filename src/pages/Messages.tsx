import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Search, Send, Smile, Home, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import EmojiPicker from 'emoji-picker-react';

interface Friend {
  friend_id: string;
  display_name: string;
  avatar_url: string;
  status: string;
  last_active: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  updated_at?: string;
}

const Messages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Load friends
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

  // Initialize chat with selected friend
  const initializeChat = async (friend: Friend) => {
    if (!user) return;
    
    try {
      // Find or create chat room
      const { data: existingRoom } = await supabase
        .from("chat_rooms")
        .select("id")
        .eq("is_group", false)
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${friend.friend_id}),and(user1_id.eq.${friend.friend_id},user2_id.eq.${user.id})`)
        .maybeSingle();

      let roomId = existingRoom?.id;

      if (!existingRoom) {
        const { data: newRoom, error } = await supabase
          .from("chat_rooms")
          .insert([{
            user1_id: user.id,
            user2_id: friend.friend_id,
            is_group: false,
          }])
          .select("id")
          .single();

        if (error) throw error;
        roomId = newRoom.id;
      }

      setChatRoomId(roomId!);
      setSelectedFriend(friend);

      // Ensure user is a member
      const { data: memberExists } = await supabase
        .from("chat_room_members")
        .select("id")
        .eq("chat_room_id", roomId!)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!memberExists) {
        await supabase
          .from("chat_room_members")
          .insert([{ chat_room_id: roomId!, user_id: user.id }]);
      }

      // Load messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_room_id", roomId!)
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
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!chatRoomId || !user || !newMessage.trim()) return;

    try {
      const { error } = await supabase.from("messages").insert({
        chat_room_id: chatRoomId,
        sender_id: user.id,
        content: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage("");
      setShowEmojiPicker(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle emoji click
  const onEmojiClick = (emojiData: any) => {
    setNewMessage(prev => prev + emojiData.emoji);
  };

  // Load friends on mount
  useEffect(() => {
    if (user) {
      loadFriends();
    }
  }, [user]);

  // Real-time messages
  useEffect(() => {
    if (!chatRoomId) return;

    const channel = supabase
      .channel(`room-${chatRoomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_room_id=eq.${chatRoomId}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatRoomId]);

  const filteredFriends = friends.filter(friend =>
    friend.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLastMessageTime = (friend: Friend) => {
    // This would ideally come from a last message query
    return new Date(friend.last_active).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        {/* Back button for mobile */}
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-4 text-muted-foreground hover:text-foreground lg:hidden"
        >
          <Home className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <div className="flex h-[calc(100vh-12rem)] bg-white rounded-lg shadow-lg overflow-hidden border">
          {/* Friends List - WhatsApp Style */}
          <div className="w-1/3 border-r bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="p-4 bg-green-600 text-white">
              <div className="flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate("/")}
                  className="text-white hover:bg-green-700 p-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-lg font-semibold">WhatsApp</h2>
                <div></div>
              </div>
              
              {/* Search */}
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-0 rounded-lg"
                />
              </div>
            </div>

            {/* Friends List */}
            <ScrollArea className="flex-1">
              {filteredFriends.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <p>No friends found</p>
                  <p className="text-sm mt-2">Add friends to start chatting!</p>
                </div>
              ) : (
                <div>
                  {filteredFriends.map((friend) => (
                    <div
                      key={friend.friend_id}
                      onClick={() => initializeChat(friend)}
                      className={`flex items-center p-4 hover:bg-gray-100 cursor-pointer border-b transition-colors ${
                        selectedFriend?.friend_id === friend.friend_id ? 'bg-gray-200' : ''
                      }`}
                    >
                      <Avatar className="h-12 w-12 mr-3">
                        <AvatarImage src={friend.avatar_url || ""} alt={friend.display_name} />
                        <AvatarFallback className="bg-gray-300 text-gray-600">
                          {friend.display_name?.split(' ').map(word => word[0]?.toUpperCase()).join('').slice(0, 2) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {friend.display_name}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          Last seen {getLastMessageTime(friend)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedFriend ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b bg-gray-50 flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={selectedFriend.avatar_url || ""} alt={selectedFriend.display_name} />
                    <AvatarFallback className="bg-gray-300 text-gray-600">
                      {selectedFriend.display_name?.split(' ').map(word => word[0]?.toUpperCase()).join('').slice(0, 2) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-gray-900">{selectedFriend.display_name}</div>
                    <div className="text-sm text-green-600">Online</div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4 bg-gray-50" style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%23f0f0f0' fill-opacity='0.1'%3e%3cpath d='M30 30c0-16.569 13.431-30 30-30v60c-16.569 0-30-13.431-30-30z'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")`,
                }}>
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p>No messages yet</p>
                      <p className="text-sm mt-1">Start the conversation!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {messages.map((message) => {
                        const isOwnMessage = message.sender_id === user?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${
                                isOwnMessage
                                  ? "bg-green-500 text-white rounded-br-md"
                                  : "bg-white text-gray-800 rounded-bl-md border"
                              }`}
                            >
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                              <p className={`text-xs mt-1 ${isOwnMessage ? 'text-green-100' : 'text-gray-500'}`}>
                                {new Date(message.created_at).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t bg-white">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        onKeyDown={handleKeyPress}
                        className="pr-10 border-gray-300 rounded-full py-3 px-4"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                      >
                        <Smile className="h-5 w-5 text-gray-500" />
                      </Button>
                      
                      {/* Emoji Picker */}
                      {showEmojiPicker && (
                        <div className="absolute bottom-full right-0 mb-2 z-50">
                          <EmojiPicker onEmojiClick={onEmojiClick} />
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="rounded-full bg-green-500 hover:bg-green-600 text-white p-3 h-12 w-12"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-lg font-medium mb-2">WhatsApp Web</h3>
                  <p>Select a friend to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Send, Smile, Home, ArrowLeft, Users, UserPlus, MessageCircle, Check, X } from "lucide-react";
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

const Messages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Chat state
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Friend management state
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [friendSearchTerm, setFriendSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("chats");

  const getInitials = (name: string) => {
    return name?.split(' ').map(word => word[0]?.toUpperCase()).join('').slice(0, 2) || 'U';
  };

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

  // Load friend requests
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

  // Search users
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

  // Send friend request
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

      await searchUsers(friendSearchTerm);
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      });
    }
  };

  // Handle friend request
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

  // Load data on mount
  useEffect(() => {
    if (user) {
      loadFriends();
      loadFriendRequests();
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

  // Debounce search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchUsers(friendSearchTerm);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [friendSearchTerm, user]);

  const filteredFriends = friends.filter(friend =>
    friend.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLastMessageTime = (friend: Friend) => {
    return new Date(friend.last_active).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        {/* Back button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-4 text-muted-foreground hover:text-foreground"
        >
          <Home className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <div className="flex h-[calc(100vh-12rem)] bg-white rounded-lg shadow-lg overflow-hidden border">
          {/* Left Panel */}
          <div className="w-1/3 border-r bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="p-4 bg-primary text-primary-foreground">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Messages</h2>
              </div>
              
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 bg-primary-foreground/10">
                  <TabsTrigger value="chats" className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Chats
                  </TabsTrigger>
                  <TabsTrigger value="requests" className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">
                    <UserPlus className="h-3 w-3 mr-1" />
                    Requests ({friendRequests.length})
                  </TabsTrigger>
                  <TabsTrigger value="find" className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground">
                    <Search className="h-3 w-3 mr-1" />
                    Find
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              {/* Chats Tab */}
              <TabsContent value="chats" className="flex-1 flex flex-col mt-0">
                {/* Search for chats */}
                <div className="p-3 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search contacts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Friends List */}
                <ScrollArea className="flex-1">
                  {filteredFriends.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
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
                              {getInitials(friend.display_name)}
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
              </TabsContent>

              {/* Requests Tab */}
              <TabsContent value="requests" className="flex-1 flex flex-col mt-0">
                <ScrollArea className="flex-1">
                  {friendRequests.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No pending requests</p>
                    </div>
                  ) : (
                    <div className="p-3">
                      {friendRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-3 rounded-lg border bg-white mb-3 shadow-sm">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={request.profiles?.avatar_url || ""} alt={request.profiles?.display_name} />
                              <AvatarFallback className="bg-gray-300 text-gray-600">
                                {getInitials(request.profiles?.display_name || '')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">{request.profiles?.display_name}</div>
                              <div className="text-xs text-gray-500">
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
                </ScrollArea>
              </TabsContent>

              {/* Find Friends Tab */}
              <TabsContent value="find" className="flex-1 flex flex-col mt-0">
                <div className="p-3 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name..."
                      value={friendSearchTerm}
                      onChange={(e) => setFriendSearchTerm(e.target.value)}
                      className="pl-10 border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  {searchResults.length === 0 && friendSearchTerm ? (
                    <div className="p-6 text-center text-gray-500">
                      <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No users found matching "{friendSearchTerm}"</p>
                    </div>
                  ) : (
                    <div className="p-3">
                      {searchResults.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border bg-white mb-3 shadow-sm">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.avatar_url || ""} alt={user.display_name} />
                              <AvatarFallback className="bg-gray-300 text-gray-600">
                                {getInitials(user.display_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">{user.display_name}</div>
                              <div className="text-xs text-gray-500">
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
                              className="bg-primary hover:bg-primary/90"
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
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
                      {getInitials(selectedFriend.display_name)}
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
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
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
                                  ? "bg-primary text-primary-foreground rounded-br-md"
                                  : "bg-white text-gray-800 rounded-bl-md border"
                              }`}
                            >
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                              <p className={`text-xs mt-1 ${isOwnMessage ? 'text-primary-foreground/70' : 'text-gray-500'}`}>
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
                      className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground p-3 h-12 w-12"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-500">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-medium mb-2">Select a friend to start chatting</h3>
                  <p>Choose from your existing conversations or find new friends</p>
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
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Friend {
  friend_id: string;
  display_name: string;
  avatar_url: string;
  status: string;
  last_active: string;
}

const FriendsList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFriends = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_friends');
      
      if (error) throw error;
      setFriends(data || []);
    } catch (error) {
      console.error("Error loading friends:", error);
      toast({
        title: "Error",
        description: "Failed to load friends list",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadFriends();
    }
  }, [user]);

  // Set up real-time subscription for friends updates
  useEffect(() => {
    if (!user) return;

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

  const startChat = async (friendId: string) => {
    try {
      // Check if a direct chat already exists
      const { data: existingRoom } = await supabase
        .from("chat_rooms")
        .select("id")
        .eq("is_group", false)
        .or(`and(user1_id.eq.${user?.id},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${user?.id})`)
        .single();

      if (existingRoom) {
        navigate(`/messages?room=${existingRoom.id}`);
        return;
      }

      // Create new direct chat
      const { data: newRoom, error } = await supabase
        .from("chat_rooms")
        .insert([{
          user1_id: user?.id,
          user2_id: friendId,
          is_group: false
        }])
        .select("id")
        .single();

      if (error) throw error;

      navigate(`/messages?room=${newRoom.id}`);
    } catch (error) {
      console.error("Error starting chat:", error);
      toast({
        title: "Error",
        description: "Failed to start chat",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">Loading friends...</div>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No friends yet</p>
        <p className="text-sm text-muted-foreground">Search for users to add as friends!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {friends.map((friend) => (
        <div key={friend.friend_id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={friend.avatar_url || ""} alt={friend.display_name} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 font-bold">
                {friend.display_name?.split(' ').map(word => word[0]?.toUpperCase()).join('').slice(0, 2) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{friend.display_name}</p>
              <Badge variant="outline" className="text-xs">
                Online
              </Badge>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => startChat(friend.friend_id)}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Chat
          </Button>
        </div>
      ))}
    </div>
  );
};

export default FriendsList;
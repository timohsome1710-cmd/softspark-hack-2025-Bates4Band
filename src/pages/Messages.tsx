import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Users, UserPlus, Home } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import MessagesPopup from "@/components/MessagesPopup";

interface Friend {
  friend_id: string;
  display_name: string;
  avatar_url: string;
  status: string;
  last_active: string;
}

const Messages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [friendRequestCount, setFriendRequestCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const loadStats = async () => {
      try {
        // Load friends count
        const { data: friendsData } = await supabase.rpc('get_user_friends');
        setFriends(friendsData || []);

        // Load unread messages count
        const { count: unreadMessages } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .neq('sender_id', user.id)
          .eq('is_read', false);
        
        setUnreadCount(unreadMessages || 0);

        // Load friend requests count
        const { count: requestsCount } = await supabase
          .from('friends')
          .select('*', { count: 'exact', head: true })
          .eq('friend_id', user.id)
          .eq('status', 'pending');

        setFriendRequestCount(requestsCount || 0);
      } catch (error) {
        console.error("Error loading stats:", error);
      }
    };

    loadStats();

    // Set up real-time subscriptions
    const friendsChannel = supabase
      .channel('friends-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, loadStats)
      .subscribe();

    const messagesChannel = supabase
      .channel('messages-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, loadStats)
      .subscribe();

    return () => {
      supabase.removeChannel(friendsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [user]);

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
          <h1 className="text-3xl font-bold text-foreground mb-2">Messages & Friends</h1>
          <p className="text-muted-foreground">Connect and chat with your friends</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl">
          {/* Messages Card */}
          <MessagesPopup>
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    Messages
                  </div>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {unreadCount}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Chat with your {friends.length} friends
                </p>
                <div className="text-xs text-primary font-medium">
                  Click to open messages
                </div>
              </CardContent>
            </Card>
          </MessagesPopup>

          {/* Friends Card */}
          <MessagesPopup>
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-secondary/20 bg-gradient-to-br from-secondary/5 to-accent/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-secondary" />
                    Friends
                  </div>
                  <span className="bg-secondary/20 text-secondary text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                    {friends.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage your friendships
                </p>
                <div className="text-xs text-secondary font-medium">
                  Click to view friends
                </div>
              </CardContent>
            </Card>
          </MessagesPopup>

          {/* Friend Requests Card */}
          <MessagesPopup>
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-accent/20 bg-gradient-to-br from-accent/5 to-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-accent" />
                    Requests
                  </div>
                  {friendRequestCount > 0 && (
                    <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {friendRequestCount}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {friendRequestCount > 0 
                    ? `${friendRequestCount} pending request${friendRequestCount > 1 ? 's' : ''}` 
                    : 'No pending requests'
                  }
                </p>
                <div className="text-xs text-accent font-medium">
                  Click to manage requests
                </div>
              </CardContent>
            </Card>
          </MessagesPopup>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="flex gap-4">
            <MessagesPopup>
              <Button className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                <MessageCircle className="h-4 w-4 mr-2" />
                Open Messages
              </Button>
            </MessagesPopup>
            <Button 
              variant="outline" 
              onClick={() => navigate("/")}
              className="border-primary/20 hover:bg-primary/5"
            >
              Back to Questions
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

const FriendRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFriendRequests = async () => {
    if (!user) return;

    try {
      // First get the friend requests
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

      // Get the user IDs who sent the requests
      const userIds = friendsData.map(f => f.user_id);

      // Fetch profile information for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
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
      toast({
        title: "Error",
        description: "Failed to load friend requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFriendRequests();

    // Set up real-time subscription for friend requests
    const channel = supabase
      .channel('friend-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friends',
          filter: `friend_id=eq.${user?.id}`,
        },
        () => {
          loadFriendRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleAcceptRequest = async (requestId: string, senderId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('user_id', senderId)
        .eq('friend_id', user?.id)
        .eq('status', 'pending');

      if (error) throw error;

      toast({
        title: "Success",
        description: "Friend request accepted!",
      });

      loadFriendRequests();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast({
        title: "Error",
        description: "Failed to accept friend request",
        variant: "destructive",
      });
    }
  };

  const handleDeclineRequest = async (requestId: string, senderId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('user_id', senderId)
        .eq('friend_id', user?.id)
        .eq('status', 'pending');

      if (error) throw error;

      toast({
        title: "Success",
        description: "Friend request declined",
      });

      loadFriendRequests();
    } catch (error) {
      console.error('Error declining friend request:', error);
      toast({
        title: "Error",
        description: "Failed to decline friend request",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(word => word[0]?.toUpperCase()).join('').slice(0, 2) || 'U';
  };

  if (loading) {
    return (
      <div className="text-center py-6">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-3"></div>
        <div className="text-sm text-muted-foreground">Loading requests...</div>
      </div>
    );
  }

  if (friendRequests.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <h3 className="font-semibold text-base mb-2">No friend requests</h3>
        <p className="text-sm">You don't have any pending friend requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {friendRequests.map((request) => (
        <div
          key={request.id}
          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
        >
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 border border-border">
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
              variant="outline"
              onClick={() => handleAcceptRequest(request.id, request.user_id)}
              className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDeclineRequest(request.id, request.user_id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FriendRequests;
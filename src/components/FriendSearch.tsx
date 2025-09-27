import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, UserCheck, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  display_name: string;
  avatar_url: string;
  is_friend: boolean;
  friend_status: string;
}

const FriendSearch = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('search_users_by_name', {
        search_term: searchTerm
      });

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching users:", error);
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const sendFriendRequest = async (friendId: string) => {
    try {
      const { error } = await supabase
        .from("friends")
        .insert([{
          user_id: user?.id,
          friend_id: friendId,
          status: 'pending'
        }]);

      if (error) throw error;

      toast({
        title: "Friend request sent!",
        description: "Your friend request has been sent successfully.",
      });

      // Refresh search results
      searchUsers();
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (friendStatus: string) => {
    switch (friendStatus) {
      case 'accepted':
        return <UserCheck className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <UserPlus className="h-4 w-4" />;
    }
  };

  const getStatusText = (friendStatus: string) => {
    switch (friendStatus) {
      case 'accepted':
        return 'Friends';
      case 'pending':
        return 'Pending';
      default:
        return 'Add Friend';
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading && (
        <div className="text-center py-4 text-muted-foreground">
          Searching...
        </div>
      )}

      <div className="space-y-2">
        {searchResults.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar_url || ""} alt={user.display_name} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 font-bold">
                  {user.display_name?.split(' ').map(word => word[0]?.toUpperCase()).join('').slice(0, 2) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.display_name}</p>
                {user.friend_status === 'accepted' && (
                  <Badge variant="secondary" className="text-xs">
                    Friend
                  </Badge>
                )}
              </div>
            </div>

            <Button
              variant={user.friend_status === 'accepted' ? "secondary" : "outline"}
              size="sm"
              onClick={() => sendFriendRequest(user.id)}
              disabled={user.friend_status !== 'none'}
            >
              {getStatusIcon(user.friend_status)}
              <span className="ml-2">{getStatusText(user.friend_status)}</span>
            </Button>
          </div>
        ))}
      </div>

      {searchTerm && !loading && searchResults.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          No users found matching "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default FriendSearch;
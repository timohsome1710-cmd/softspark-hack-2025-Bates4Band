import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Crown, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LeaderboardEntry {
  display_name: string;
  avatar_url?: string;
  level: number;
  total_exp: number;
  seasonal_exp: number;
  trophy_rank: string;
}

const SimplifiedLeaderboard = () => {
  const navigate = useNavigate();
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [seasonProgress, setSeasonProgress] = useState(0);
  const [daysRemaining, setDaysRemaining] = useState(90);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        
        // Use separate queries instead of joins to avoid FK issues
        const { data: userStatsData, error: statsError } = await supabase
          .from('user_stats')
          .select('user_id, level, total_exp, seasonal_exp, trophy_rank')
          .order('seasonal_exp', { ascending: false })
          .limit(3);

        if (statsError) {
          console.error("Stats query error:", statsError);
          return;
        }

        if (!userStatsData || userStatsData.length === 0) {
          setTopPlayers([]);
          return;
        }

        // Get profile data for each user
        const formattedData = await Promise.all(
          userStatsData.map(async (stat) => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('display_name, avatar_url')
              .eq('id', stat.user_id)
              .single();

            return {
              display_name: profileData?.display_name || 'Unknown User',
              avatar_url: profileData?.avatar_url,
              level: stat.level,
              total_exp: stat.total_exp,
              seasonal_exp: stat.seasonal_exp,
              trophy_rank: stat.trophy_rank
            };
          })
        );

        setTopPlayers(formattedData);

        // Get current season info
        const { data: seasonData } = await supabase
          .from('seasons')
          .select('start_date, end_date, is_active')
          .eq('is_active', true)
          .single();

        if (seasonData) {
          const now = new Date();
          const startDate = new Date(seasonData.start_date);
          const endDate = new Date(seasonData.end_date);
          const totalDuration = endDate.getTime() - startDate.getTime();
          const elapsed = now.getTime() - startDate.getTime();
          const progress = Math.min((elapsed / totalDuration) * 100, 100);
          
          const remaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          
          setSeasonProgress(progress);
          setDaysRemaining(remaining);
        }
      } catch (error) {
        console.error("Error loading leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();

    // Set up real-time subscription
    const channel = supabase
      .channel('leaderboard-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_stats'
      }, () => {
        loadLeaderboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getRankColor = (rank: number, trophyRank: string) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-600"; // Gold
    if (rank === 2) return "bg-gradient-to-r from-gray-400 to-gray-600"; // Silver  
    if (rank === 3) return "bg-gradient-to-r from-orange-400 to-orange-600"; // Bronze
    return "bg-gradient-to-r from-muted to-muted-foreground"; // Default
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-4 w-4 text-yellow-500" />;
    if (rank === 2) return <span className="text-sm">🥈</span>;
    if (rank === 3) return <span className="text-sm">🥉</span>;
    return <span className="text-xs font-bold text-muted-foreground">#{rank}</span>;
  };

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-card to-background/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-secondary" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Loading leaderboard...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4" />
          Leaderboard
        </CardTitle>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Season 1</span>
            <span className="font-medium">{daysRemaining} days left</span>
          </div>
          <Progress value={seasonProgress} className="h-1" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 p-4">
        {topPlayers.length > 0 ? topPlayers.map((entry, index) => {
          const rank = index + 1;
          return (
            <div
              key={`${entry.display_name}-${rank}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/30 transition-colors"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                {getRankIcon(rank)}
              </div>
              
              <Avatar className="h-8 w-8">
                <AvatarImage src={entry.avatar_url || ""} alt={entry.display_name} />
                <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-primary/10 to-secondary/10">
                  {getInitials(entry.display_name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold truncate">{entry.display_name}</div>
                  <div className="text-sm font-bold text-secondary">{entry.seasonal_exp}</div>
                </div>
                <div className="text-xs text-muted-foreground">Level {entry.level}</div>
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-6 text-sm text-muted-foreground">
            No data yet
          </div>
        )}
        
        <Button 
          variant="outline" 
          size="sm"
          className="w-full mt-4 text-xs text-foreground border-border hover:bg-accent hover:text-accent-foreground"
          onClick={() => navigate("/leaderboard")}
        >
          View Full Leaderboard
          <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default SimplifiedLeaderboard;
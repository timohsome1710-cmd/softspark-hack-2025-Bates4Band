import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, Star, Crown, Zap, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import UserLevel from "@/components/UserLevel";
import { useNavigate } from "react-router-dom";

interface LeaderboardUser {
  user_id: string;
  level: number;
  exp_points: number;
  seasonal_exp: number;
  total_exp: number;
  trophy_rank: string;
  profiles: {
    display_name: string;
    avatar_url?: string;
  };
}

const Leaderboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [seasonalLeaders, setSeasonalLeaders] = useState<LeaderboardUser[]>([]);
  const [allTimeLeaders, setAllTimeLeaders] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<{ seasonal: number; allTime: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("seasonal");

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    try {
      // Load seasonal leaderboard
      const { data: seasonalData, error: seasonalError } = await supabase
        .from('user_stats')
        .select('user_id, level, exp_points, seasonal_exp, total_exp, trophy_rank')
        .order('seasonal_exp', { ascending: false })
        .limit(50);

      if (seasonalError) throw seasonalError;

      // Load all-time leaderboard  
      const { data: allTimeData, error: allTimeError } = await supabase
        .from('user_stats')
        .select('user_id, level, exp_points, seasonal_exp, total_exp, trophy_rank')
        .order('total_exp', { ascending: false })
        .limit(50);

      if (allTimeError) throw allTimeError;

      // Get profiles for users
      const userIds = [...(seasonalData || []), ...(allTimeData || [])].map(u => u.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      // Combine data
      const enrichedSeasonal = (seasonalData || []).map(user => ({
        ...user,
        profiles: profiles?.find(p => p.id === user.user_id) || { display_name: 'Unknown User' }
      }));

      const enrichedAllTime = (allTimeData || []).map(user => ({
        ...user,
        profiles: profiles?.find(p => p.id === user.user_id) || { display_name: 'Unknown User' }
      }));

      setSeasonalLeaders(enrichedSeasonal as LeaderboardUser[]);
      setAllTimeLeaders(enrichedAllTime as LeaderboardUser[]);

      // Find user's rank
      if (user) {
        const seasonalRank = enrichedSeasonal.findIndex(u => u.user_id === user.id) + 1;
        const allTimeRank = enrichedAllTime.findIndex(u => u.user_id === user.id) + 1;
        setUserRank({
          seasonal: seasonalRank || 0,
          allTime: allTimeRank || 0
        });
      }
    } catch (error) {
      console.error('Error loading leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrophyIcon = (rank: string) => {
    const icons = {
      bronze: <Medal className="h-4 w-4 text-amber-600" />,
      silver: <Medal className="h-4 w-4 text-gray-500" />,
      gold: <Trophy className="h-4 w-4 text-yellow-500" />,
      platinum: <Award className="h-4 w-4 text-gray-600" />,
      diamond: <Star className="h-4 w-4 text-blue-500" />,
      radiant: <Crown className="h-4 w-4 text-pink-500" />
    };
    return icons[rank as keyof typeof icons] || icons.bronze;
  };

  const getRankIcon = (position: number) => {
    if (position === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (position === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (position === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="font-bold text-muted-foreground">#{position}</span>;
  };

  const getRankBadgeColor = (position: number) => {
    if (position === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
    if (position === 2) return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
    if (position === 3) return "bg-gradient-to-r from-amber-400 to-amber-600 text-white";
    return "bg-muted text-muted-foreground";
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const LeaderboardList = ({ leaders, type }: { leaders: LeaderboardUser[], type: 'seasonal' | 'allTime' }) => (
    <div className="space-y-3">
      {leaders.map((leader, index) => {
        const position = index + 1;
        const isCurrentUser = leader.user_id === user?.id;
        const expValue = type === 'seasonal' ? leader.seasonal_exp : leader.total_exp;
        
        return (
          <Card 
            key={leader.user_id}
            className={`transition-all hover:shadow-md ${
              isCurrentUser ? 'ring-2 ring-primary bg-primary/5' : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12">
                  {position <= 3 ? (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRankBadgeColor(position)}`}>
                      {getRankIcon(position)}
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <span className="font-bold text-sm">#{position}</span>
                    </div>
                  )}
                </div>

                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarImage src={leader.profiles?.avatar_url} alt={leader.profiles?.display_name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 font-bold">
                    {leader.profiles?.display_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">
                      {leader.profiles?.display_name || 'Unknown User'}
                    </h3>
                    {isCurrentUser && (
                      <Badge variant="secondary" className="text-xs">You</Badge>
                    )}
                  </div>
                  <UserLevel userId={leader.user_id} />
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="font-bold text-lg">{formatNumber(expValue)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {getTrophyIcon(leader.trophy_rank)}
                    <span className="text-sm text-muted-foreground capitalize">
                      {leader.trophy_rank}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading leaderboards...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            ← Back to Home
          </Button>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
              <Trophy className="h-8 w-8 text-primary" />
              Leaderboard
            </h1>
            <p className="text-muted-foreground">Compete with fellow students and climb the ranks!</p>
          </div>

          {/* User Rank Display */}
          {userRank && (
            <Card className="mb-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold mb-2">Your Rankings</h3>
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span>Seasonal: #{userRank.seasonal || 'Unranked'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-secondary" />
                        <span>All-Time: #{userRank.allTime || 'Unranked'}</span>
                      </div>
                    </div>
                  </div>
                  {user && <UserLevel userId={user.id} showDetails />}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="seasonal" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Seasonal Rankings
            </TabsTrigger>
            <TabsTrigger value="alltime" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              All-Time Rankings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="seasonal">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Seasonal Leaderboard
                  <Badge variant="outline" className="ml-auto">Season 1</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Rankings based on EXP earned this season (resets every 90 days)
                </p>
              </CardHeader>
              <CardContent>
                <LeaderboardList leaders={seasonalLeaders} type="seasonal" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alltime">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-secondary" />
                  All-Time Leaderboard
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Rankings based on total EXP accumulated across all seasons
                </p>
              </CardHeader>
              <CardContent>
                <LeaderboardList leaders={allTimeLeaders} type="allTime" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Leaderboard;
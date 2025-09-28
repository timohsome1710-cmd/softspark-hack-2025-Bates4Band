import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Award, Crown, ArrowLeft, RefreshCw, Zap, Home } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import TrophyRanks from "@/components/TrophyRanks";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  seasonal_exp: number;
  total_exp: number;
  level: number;
  questions_answered: number;
  trophy_rank: string;
}

const Leaderboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [seasonProgress, setSeasonProgress] = useState(0);
  const [daysRemaining, setDaysRemaining] = useState(90);
  const [totalPlayers, setTotalPlayers] = useState(0);

  const loadLeaderboard = async () => {
    setLoadingData(true);
    try {
      // Use separate queries to avoid FK relationship issues
      const { data: userStats, error } = await supabase
        .from("user_stats")
        .select("user_id, seasonal_exp, total_exp, level, questions_answered, trophy_rank")
        .order("seasonal_exp", { ascending: false });

      if (error) throw error;

      // Get profile data for each user
      const leaderboard = await Promise.all(
        (userStats || []).map(async (stat, index) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("id", stat.user_id)
            .single();

          return {
            rank: index + 1,
            user_id: stat.user_id,
            display_name: profile?.display_name || "Unknown User",
            avatar_url: profile?.avatar_url,
            seasonal_exp: stat.seasonal_exp,
            total_exp: stat.total_exp,
            level: stat.level,
            questions_answered: stat.questions_answered,
            trophy_rank: stat.trophy_rank,
          };
        })
      );

      setLeaderboardData(leaderboard);
      setTotalPlayers(leaderboard.length);

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
      toast({
        title: "Error",
        description: "Failed to load leaderboard",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }
    
    loadLeaderboard();
  }, [user, loading, navigate]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2: return <span className="text-lg font-bold text-gray-400">2</span>;
      case 3: return <span className="text-lg font-bold text-orange-500">3</span>;
      default: return <span className="text-lg font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getTrophyRankInfo = (rank: string) => {
    switch (rank) {
      case 'radiant': return { color: 'text-purple-600 bg-purple-100', border: 'border-purple-300', exp: '20,000+ EXP', badge: 'bg-gradient-to-r from-purple-500 to-pink-500' };
      case 'diamond': return { color: 'text-blue-600 bg-blue-100', border: 'border-blue-300', exp: '10,000+ EXP', badge: 'bg-gradient-to-r from-blue-500 to-cyan-500' };
      case 'platinum': return { color: 'text-cyan-600 bg-cyan-100', border: 'border-cyan-300', exp: '5,000+ EXP', badge: 'bg-gradient-to-r from-cyan-500 to-teal-500' };
      case 'gold': return { color: 'text-yellow-600 bg-yellow-100', border: 'border-yellow-300', exp: '2,000+ EXP', badge: 'bg-gradient-to-r from-yellow-500 to-orange-500' };
      case 'silver': return { color: 'text-gray-600 bg-gray-100', border: 'border-gray-300', exp: '500+ EXP', badge: 'bg-gradient-to-r from-gray-400 to-gray-500' };
      case 'bronze': return { color: 'text-orange-600 bg-orange-100', border: 'border-orange-300', exp: '0+ EXP', badge: 'bg-gradient-to-r from-orange-500 to-red-500' };
      default: return { color: 'text-muted-foreground bg-muted', border: 'border-muted', exp: '0 EXP', badge: 'bg-muted' };
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(word => word[0]?.toUpperCase()).join('').slice(0, 2) || 'U';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <Home className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Trophy className="h-8 w-8 text-secondary" />
            Season 1
          </h1>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={loadLeaderboard}
            disabled={loadingData}
          >
            <RefreshCw className={`h-4 w-4 ${loadingData ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Season Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Season 1
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Season Progress</span>
                    <span className="font-medium">{Math.round(seasonProgress)}%</span>
                  </div>
                  <Progress value={seasonProgress} className="h-2 bg-muted" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {daysRemaining} days remaining
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-lg font-bold">{totalPlayers}</div>
                  <div className="text-sm text-muted-foreground">Total Players</div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-muted-foreground mb-2">Season Resets</div>
                  <div className="text-sm font-medium">Dec 26, 2025</div>
                </div>
              </CardContent>
            </Card>

            {/* Trophy Ranks */}
            <TrophyRanks />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="seasonal" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="seasonal">Seasonal Rankings</TabsTrigger>
                <TabsTrigger value="alltime">All-Time Rankings</TabsTrigger>
              </TabsList>

              <TabsContent value="seasonal">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Season 1 Leaderboard
                    </CardTitle>
                    <p className="text-muted-foreground">Rankings based on seasonal EXP earned this season</p>
                  </CardHeader>
                  <CardContent>
                    {loadingData ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Loading leaderboard...
                      </div>
                    ) : leaderboardData.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No leaderboard data available
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {leaderboardData.map((entry) => (
                          <div
                            key={entry.user_id}
                            className={`flex items-center justify-between p-4 rounded-xl border-2 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] ${
                              entry.user_id === user.id 
                                ? 'ring-2 ring-primary bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30' 
                                : 'bg-gradient-to-r from-card to-muted/20 border-border hover:border-primary/20'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8">
                                {getRankIcon(entry.rank)}
                              </div>
                              
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={entry.avatar_url} alt={entry.display_name} />
                                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 font-bold">
                                  {getInitials(entry.display_name)}
                                </AvatarFallback>
                              </Avatar>

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">{entry.display_name}</span>
                                  {entry.user_id === user.id && (
                                    <Badge variant="secondary" className="text-xs">You</Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    Lv. {entry.level}
                                  </Badge>
                                  <Badge 
                                    variant="outline" 
                                    className={`uppercase text-xs font-bold ${getTrophyRankInfo(entry.trophy_rank).color} ${getTrophyRankInfo(entry.trophy_rank).border} border`}
                                  >
                                    {entry.trophy_rank}
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {entry.questions_answered} answers • {entry.total_exp} total EXP
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                                {entry.seasonal_exp}
                              </div>
                              <div className="text-xs text-muted-foreground font-medium">Season EXP</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="alltime">
                <Card>
                  <CardHeader>
                    <CardTitle>All-Time Rankings</CardTitle>
                    <p className="text-muted-foreground">Rankings based on total EXP earned across all seasons</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {leaderboardData
                        .sort((a, b) => b.total_exp - a.total_exp)
                        .map((entry, index) => (
                           <div
                             key={`alltime-${entry.user_id}`}
                             className={`flex items-center justify-between p-5 rounded-2xl border-2 bg-gradient-to-r hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] ${
                               entry.user_id === user.id 
                                 ? 'ring-2 ring-primary from-primary/10 to-secondary/10 border-primary/30' 
                                 : 'from-card to-muted/30 border-border hover:border-secondary/30'
                             }`}
                           >
                            <div className="flex items-center gap-4">
                              <div className="flex items-center justify-center w-10">
                                <span className="text-lg font-bold text-muted-foreground">{index + 1}</span>
                              </div>
                              
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={entry.avatar_url} alt={entry.display_name} />
                                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 font-bold">
                                  {getInitials(entry.display_name)}
                                </AvatarFallback>
                              </Avatar>

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-lg">{entry.display_name}</span>
                                  {entry.user_id === user.id && (
                                    <Badge variant="secondary" className="text-xs">You</Badge>
                                  )}
                                  <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground">
                                    Level {entry.level}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                  <span>🏅 {entry.questions_answered} Answers</span>
                                  <span>⚡ {entry.seasonal_exp} Season EXP</span>
                                </div>
                              </div>
                            </div>

                             <div className="text-right">
                               <div className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                 {entry.total_exp}
                               </div>
                               <div className="text-sm text-muted-foreground font-medium">Total EXP</div>
                             </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
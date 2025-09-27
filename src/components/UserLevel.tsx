import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Star, Zap } from "lucide-react";

interface UserLevelProps {
  userId: string;
  showDetails?: boolean;
}

interface UserStats {
  level: number;
  exp_points: number;
  seasonal_exp: number;
  total_exp: number;
  trophy_rank: string;
}

const UserLevel = ({ userId, showDetails = false }: UserLevelProps) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!userId) return;
      
      try {
        const { data, error } = await supabase
          .from('user_stats')
          .select('level, exp_points, seasonal_exp, total_exp, trophy_rank')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') { // Not found is okay
          console.error('Error fetching user stats:', error);
          return;
        }

        setStats(data || {
          level: 1,
          exp_points: 0,
          seasonal_exp: 0,
          total_exp: 0,
          trophy_rank: 'bronze'
        });
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [userId]);

  const getTrophyInfo = (rank: string) => {
    const trophies = {
      bronze: { name: 'Bronze', color: 'text-amber-600', bgColor: 'bg-amber-100', threshold: 500 },
      silver: { name: 'Silver', color: 'text-gray-600', bgColor: 'bg-gray-100', threshold: 2000 },
      gold: { name: 'Gold', color: 'text-yellow-600', bgColor: 'bg-yellow-100', threshold: 5000 },
      platinum: { name: 'Platinum', color: 'text-gray-800', bgColor: 'bg-gray-200', threshold: 10000 },
      diamond: { name: 'Diamond', color: 'text-blue-600', bgColor: 'bg-blue-100', threshold: 20000 },
      radiant: { name: 'Radiant', color: 'text-pink-600', bgColor: 'bg-pink-100', threshold: 20000 }
    };
    
    return trophies[rank as keyof typeof trophies] || trophies.bronze;
  };

  const getNextLevelExp = (level: number) => {
    return Math.pow(level, 2) * 100; // Formula: level^2 * 100
  };

  const getCurrentLevelExp = (level: number) => {
    return level === 1 ? 0 : Math.pow(level - 1, 2) * 100;
  };

  if (loading || !stats) {
    return showDetails ? (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-2 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    ) : (
      <Badge variant="outline" className="animate-pulse">
        <Star className="h-3 w-3 mr-1" />
        Lv. --
      </Badge>
    );
  }

  const trophy = getTrophyInfo(stats.trophy_rank);
  const nextLevelExp = getNextLevelExp(stats.level);
  const currentLevelExp = getCurrentLevelExp(stats.level);
  const expProgress = stats.total_exp - currentLevelExp;
  const expNeeded = nextLevelExp - currentLevelExp;
  const progressPercent = (expProgress / expNeeded) * 100;

  const trophyProgress = (stats.seasonal_exp / trophy.threshold) * 100;

  if (!showDetails) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          <Star className="h-3 w-3 mr-1" />
          Lv. {stats.level}
        </Badge>
        <Badge className={`text-xs ${trophy.bgColor} ${trophy.color} border-0`}>
          <Trophy className="h-3 w-3 mr-1" />
          {trophy.name}
        </Badge>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Level Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                <span className="font-medium">Level {stats.level}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {expProgress}/{expNeeded} EXP
              </span>
            </div>
            <Progress value={Math.min(progressPercent, 100)} className="h-2" />
          </div>

          {/* Trophy Rank */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy className={`h-4 w-4 ${trophy.color}`} />
                <span className="font-medium">{trophy.name}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {stats.seasonal_exp}/{trophy.threshold === 20000 && stats.trophy_rank === 'radiant' ? '∞' : trophy.threshold} EXP
              </span>
            </div>
            <Progress 
              value={Math.min(trophyProgress, 100)} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Seasonal progress (resets every 90 days)
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-yellow-500" />
              <span className="text-muted-foreground">Total EXP:</span>
              <span className="font-medium">{stats.total_exp}</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className={`h-3 w-3 ${trophy.color}`} />
              <span className="text-muted-foreground">Season EXP:</span>
              <span className="font-medium">{stats.seasonal_exp}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserLevel;
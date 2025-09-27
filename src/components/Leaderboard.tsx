import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Award, Crown } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  exp: number;
  level: number;
  questionsAnswered: number;
  badge?: string;
}

const leaderboardData: LeaderboardEntry[] = [
  { rank: 1, name: "Alex Chen", avatar: "", exp: 4850, level: 18, questionsAnswered: 127, badge: "👑" },
  { rank: 2, name: "Maria Santos", avatar: "", exp: 4200, level: 16, questionsAnswered: 98, badge: "🥈" },
  { rank: 3, name: "David Kim", avatar: "", exp: 3890, level: 15, questionsAnswered: 89, badge: "🥉" },
  { rank: 4, name: "Sophie Zhang", avatar: "", exp: 3450, level: 14, questionsAnswered: 76 },
  { rank: 5, name: "Ryan Wilson", avatar: "", exp: 3200, level: 13, questionsAnswered: 68 },
  { rank: 6, name: "Emma Brown", avatar: "", exp: 2980, level: 12, questionsAnswered: 62 },
  { rank: 7, name: "James Lee", avatar: "", exp: 2750, level: 11, questionsAnswered: 55 },
  { rank: 8, name: "Lisa Wang", avatar: "", exp: 2500, level: 10, questionsAnswered: 48 },
];

const Leaderboard = () => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-5 w-5 text-level-gold" />;
      case 2: return <Medal className="h-5 w-5 text-level-silver" />;
      case 3: return <Award className="h-5 w-5 text-level-bronze" />;
      default: return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1: return "bg-gradient-to-r from-level-gold/20 to-level-gold/10 border-level-gold/30";
      case 2: return "bg-gradient-to-r from-level-silver/20 to-level-silver/10 border-level-silver/30";
      case 3: return "bg-gradient-to-r from-level-bronze/20 to-level-bronze/10 border-level-bronze/30";
      default: return "bg-card hover:bg-muted/50 border-border";
    }
  };

  const seasonProgress = 65; // 65% through current season

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-secondary" />
          Weekly Leaderboard
        </CardTitle>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Season 23 Progress</span>
            <span className="font-medium">4 days left</span>
          </div>
          <Progress value={seasonProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Season resets weekly. Top performers earn exclusive badges! 🏆
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1">
          {leaderboardData.map((entry) => (
            <div
              key={entry.rank}
              className={`flex items-center gap-4 p-4 mx-4 mb-2 rounded-lg border transition-all duration-200 ${getRankBg(entry.rank)}`}
            >
              {/* Rank */}
              <div className="flex items-center justify-center w-8">
                {getRankIcon(entry.rank)}
              </div>

              {/* User Info */}
              <div className="flex items-center gap-3 flex-1">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={entry.avatar} alt={entry.name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20">
                    {entry.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{entry.name}</span>
                    {entry.badge && <span className="text-lg">{entry.badge}</span>}
                    <Badge variant="outline" className="text-xs">
                      Lv. {entry.level}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {entry.questionsAnswered} answers
                  </div>
                </div>
              </div>

              {/* EXP */}
              <div className="text-right">
                <div className="font-bold text-lg">{entry.exp.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">EXP</div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t bg-muted/30">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              🎯 Answer questions to climb the leaderboard!
            </p>
            <Badge className="bg-gradient-to-r from-secondary to-accent text-primary">
              Next reset in 4 days
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
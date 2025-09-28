import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const trophyRanks = [
  { name: "Radiant", exp: "20,000+ EXP", color: "bg-gradient-to-r from-pink-500 to-purple-600 text-white" },
  { name: "Diamond", exp: "10,000+ EXP", color: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white" },
  { name: "Platinum", exp: "5,000+ EXP", color: "bg-gradient-to-r from-teal-500 to-emerald-500 text-white" },
  { name: "Gold", exp: "2,000+ EXP", color: "bg-gradient-to-r from-yellow-500 to-amber-500 text-white" },
  { name: "Silver", exp: "500+ EXP", color: "bg-gradient-to-r from-gray-400 to-gray-500 text-white" },
  { name: "Bronze", exp: "0+ EXP", color: "bg-gradient-to-r from-orange-400 to-red-400 text-white" },
];

const TrophyRanks = () => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Trophy Ranks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {trophyRanks.map((rank) => (
          <div key={rank.name} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
            <Badge className={`${rank.color} font-semibold px-3 py-1`}>
              {rank.name}
            </Badge>
            <span className="text-sm font-medium text-muted-foreground">
              {rank.exp}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default TrophyRanks;
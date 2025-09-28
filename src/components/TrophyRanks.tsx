import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const trophyRanks = [
  { name: "Radiant", color: "from-pink-400 to-purple-500", textColor: "text-white", exp: "20,000+ EXP", bgColor: "bg-gradient-to-r from-pink-400 to-purple-500" },
  { name: "Diamond", color: "from-blue-400 to-cyan-400", textColor: "text-white", exp: "10,000+ EXP", bgColor: "bg-gradient-to-r from-blue-400 to-cyan-400" },
  { name: "Platinum", color: "from-teal-400 to-green-400", textColor: "text-white", exp: "5,000+ EXP", bgColor: "bg-gradient-to-r from-teal-400 to-green-400" },
  { name: "Gold", color: "from-yellow-400 to-orange-400", textColor: "text-white", exp: "2,000+ EXP", bgColor: "bg-gradient-to-r from-yellow-400 to-orange-400" },
  { name: "Silver", color: "from-gray-300 to-gray-500", textColor: "text-white", exp: "500+ EXP", bgColor: "bg-gradient-to-r from-gray-300 to-gray-500" },
  { name: "Bronze", color: "from-orange-300 to-red-400", textColor: "text-white", exp: "0+ EXP", bgColor: "bg-gradient-to-r from-orange-300 to-red-400" },
];

const TrophyRanks = () => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold text-gray-800">Trophy Ranks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {trophyRanks.map((rank) => (
          <div
            key={rank.name}
            className={`${rank.bgColor} rounded-lg p-4 flex items-center justify-between shadow-sm`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full bg-white/30`} />
              <span className={`font-semibold ${rank.textColor}`}>
                {rank.name}
              </span>
            </div>
            <span className={`text-sm font-medium ${rank.textColor}/90`}>
              {rank.exp}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default TrophyRanks;
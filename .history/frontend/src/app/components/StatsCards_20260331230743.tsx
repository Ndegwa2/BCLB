import { motion } from "motion/react";
import { Card } from "./ui/card";
import { TrendingUp, Trophy, Target, DollarSign } from "lucide-react";

interface StatsCardsProps {
  stats: {
    totalGamesPlayed: number;
    totalWins: number;
    winRate: number;
    totalEarnings: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Games",
      value: stats.totalGamesPlayed,
      icon: Target,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-600",
    },
    {
      title: "Total Wins",
      value: stats.totalWins,
      icon: Trophy,
      color: "from-yellow-500 to-orange-500",
      bgColor: "bg-yellow-500/10",
      iconColor: "text-yellow-600",
    },
    {
      title: "Win Rate",
      value: `${stats.winRate}%`,
      icon: TrendingUp,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-500/10",
      iconColor: "text-green-600",
    },
    {
      title: "Total Earnings",
      value: `$${stats.totalEarnings.toFixed(2)}`,
      icon: DollarSign,
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-500/10",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold">{card.value}</p>
              </div>
              <div className={`size-12 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                <card.icon className={`size-6 ${card.iconColor}`} />
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
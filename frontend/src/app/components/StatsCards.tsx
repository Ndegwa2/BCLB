import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { TrendingUp, Trophy, Target, Gamepad2 } from "lucide-react";

interface StatsCardsProps {
  stats: {
    totalWinnings: number;
    winRate: number;
    gamesPlayed: number;
    activeTournaments: number;
  };
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ElementType;
  gradientFrom: string;
  gradientTo: string;
  delay: number;
  showLiveBadge?: boolean;
}

function StatCard({ 
  title, 
  value, 
  change, 
  changeType = "neutral",
  icon: Icon,
  gradientFrom,
  gradientTo,
  delay,
  showLiveBadge
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === "number" ? value : parseFloat(value.toString().replace(/[^0-9.]/g, ""));

  useEffect(() => {
    if (typeof numericValue === "number" && !isNaN(numericValue)) {
      const duration = 1500;
      const steps = 60;
      const increment = numericValue / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= numericValue) {
          setDisplayValue(numericValue);
          clearInterval(timer);
        } else {
          setDisplayValue(current);
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [numericValue]);

  const formatValue = () => {
    if (typeof value === "string") return value;
    if (value >= 1000) return `$${displayValue.toFixed(2)}`;
    if (title.includes("Rate")) return `${Math.round(displayValue)}%`;
    return Math.round(displayValue).toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.3 }}
      className="stats-card group"
      style={{
        "--card-color-from": gradientFrom,
        "--card-color-to": gradientTo,
      } as React.CSSProperties}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-white/60 font-medium">{title}</p>
          <motion.p 
            className="text-3xl font-bold text-white"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay * 0.1 + 0.2, type: "spring", stiffness: 200 }}
          >
            {formatValue()}
          </motion.p>
          {change && (
            <div className={`flex items-center gap-1 text-xs ${
              changeType === "positive" ? "text-green-400" : 
              changeType === "negative" ? "text-red-400" : 
              "text-white/40"
            }`}>
              {changeType === "positive" && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
              {changeType === "negative" && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              <span>{change}</span>
            </div>
          )}
        </div>
        <motion.div 
          className={`w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg`}
          style={{ 
            background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
            boxShadow: `0 8px 20px ${gradientFrom}40`
          }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <Icon className="w-6 h-6 text-white" />
        </motion.div>
      </div>
      {showLiveBadge && (
        <div className="absolute top-4 right-4">
          <span className="badge-live">
            <span className="w-2 h-2 rounded-full bg-green-400 mr-1.5 animate-pulse" />
            Live
          </span>
        </div>
      )}
    </motion.div>
  );
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Winnings",
      value: stats.totalWinnings,
      change: "+12.5% this week",
      changeType: "positive" as const,
      icon: TrendingUp,
      gradientFrom: "#22c55e",
      gradientTo: "#10b981",
    },
    {
      title: "Win Rate",
      value: stats.winRate,
      change: "+3% from last month",
      changeType: "positive" as const,
      icon: Target,
      gradientFrom: "#3b82f6",
      gradientTo: "#06b6d4",
    },
    {
      title: "Games Played",
      value: stats.gamesPlayed,
      change: "15 this week",
      changeType: "neutral" as const,
      icon: Gamepad2,
      gradientFrom: "#8b5cf6",
      gradientTo: "#a855f7",
    },
    {
      title: "Active Tournaments",
      value: stats.activeTournaments,
      showLiveBadge: stats.activeTournaments > 0,
      icon: Trophy,
      gradientFrom: "#eab308",
      gradientTo: "#f97316",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <StatCard key={card.title} {...card} delay={index} />
      ))}
    </div>
  );
}
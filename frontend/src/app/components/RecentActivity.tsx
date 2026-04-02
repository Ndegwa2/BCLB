import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy,
  XCircle,
  Flag,
  Sparkles,
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface ActivityItem {
  id: string;
  type: "game_win" | "game_loss" | "tournament_start" | "tournament_join" | "big_win" | "deposit";
  username: string;
  amount?: number;
  gameType?: string;
  tournamentName?: string;
  playerCount?: number;
  timestamp: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
  maxItems?: number;
}

type FilterType = "all" | "wins" | "losses";

export function RecentActivity({ activities, maxItems = 20 }: RecentActivityProps) {
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredActivities = activities
    .filter((activity) => {
      if (filter === "all") return true;
      if (filter === "wins") return activity.type === "game_win" || activity.type === "big_win";
      if (filter === "losses") return activity.type === "game_loss";
      return true;
    })
    .slice(0, maxItems);

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "game_win":
        return <Trophy className="w-4 h-4 text-green-400" />;
      case "game_loss":
        return <XCircle className="w-4 h-4 text-red-400" />;
      case "tournament_start":
        return <Flag className="w-4 h-4 text-blue-400" />;
      case "tournament_join":
        return <Flag className="w-4 h-4 text-purple-400" />;
      case "big_win":
        return <Sparkles className="w-4 h-4 text-yellow-400" />;
      case "deposit":
        return <Sparkles className="w-4 h-4 text-green-400" />;
    }
  };

  const getActivityBackground = (type: ActivityItem["type"]) => {
    switch (type) {
      case "game_win":
        return "bg-green-500/10";
      case "game_loss":
        return "bg-red-500/10";
      case "tournament_start":
        return "bg-blue-500/10";
      case "tournament_join":
        return "bg-purple-500/10";
      case "big_win":
        return "bg-yellow-500/10";
      case "deposit":
        return "bg-green-500/10";
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case "game_win":
        return (
          <>
            <span className="font-semibold text-white">{activity.username}</span>{" "}
            <span className="text-green-400">won ${activity.amount?.toFixed(2)}</span>
          </>
        );
      case "game_loss":
        return (
          <>
            <span className="font-semibold text-white">{activity.username}</span>{" "}
            <span className="text-red-400">lost ${activity.amount?.toFixed(2)}</span>
          </>
        );
      case "tournament_start":
        return (
          <>
            <span className="font-semibold text-white">{activity.tournamentName}</span>{" "}
            <span className="text-blue-400">started</span>
          </>
        );
      case "tournament_join":
        return (
          <>
            <span className="font-semibold text-white">{activity.username}</span>{" "}
            <span className="text-purple-400">joined tournament</span>
          </>
        );
      case "big_win":
        return (
          <>
            <span className="text-yellow-400">🎉 </span>
            <span className="font-semibold text-white">{activity.username}</span>{" "}
            <span className="text-yellow-400">won ${activity.amount?.toFixed(2)}!</span>
          </>
        );
      case "deposit":
        return (
          <>
            <span className="font-semibold text-white">{activity.username}</span>{" "}
            <span className="text-green-400">deposited ${activity.amount?.toFixed(2)}</span>
          </>
        );
    }
  };

  const getSubtext = (activity: ActivityItem) => {
    const parts = [];
    if (activity.gameType) {
      parts.push(activity.gameType);
    }
    if (activity.playerCount) {
      parts.push(`${activity.playerCount} players`);
    }
    parts.push(formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }));
    return parts.join(" • ");
  };

  return (
    <div className="glass-card">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Recent Activity
          </h3>
        </div>
        
        {/* Filter Pills */}
        <div className="flex gap-2">
          {[
            { id: "all" as FilterType, label: "All" },
            { id: "wins" as FilterType, label: "Wins" },
            { id: "losses" as FilterType, label: "Losses" },
          ].map((filterOption) => (
            <button
              key={filterOption.id}
              onClick={() => setFilter(filterOption.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                filter === filterOption.id
                  ? "bg-purple-600 text-white"
                  : "bg-white/10 text-white/60 hover:bg-white/20"
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity List */}
      <div className="max-h-[400px] overflow-y-auto">
        {filteredActivities.length > 0 ? (
          <div className="divide-y divide-white/5">
            <AnimatePresence>
              {filteredActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`activity-item ${activity.type === "big_win" ? "bg-yellow-500/5" : ""}`}
                >
                  <div className={`w-8 h-8 rounded-lg ${getActivityBackground(activity.type)} flex items-center justify-center flex-shrink-0`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{getActivityText(activity)}</p>
                    <p className="text-xs text-white/40 mt-0.5">{getSubtext(activity)}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-white/60 text-sm">
              {filter === "all" 
                ? "No recent activity yet" 
                : `No ${filter} found`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
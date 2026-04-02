import { motion } from "motion/react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { TrendingUp, TrendingDown, Trophy, Users } from "lucide-react";

interface Activity {
  id: string;
  type: "game" | "tournament" | "deposit" | "withdrawal";
  description: string;
  amount: number;
  result?: "win" | "loss";
  timestamp: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityIcon = (activity: Activity) => {
    switch (activity.type) {
      case "game":
        return activity.result === "win" ? TrendingUp : TrendingDown;
      case "tournament":
        return Trophy;
      default:
        return Users;
    }
  };

  const getActivityColor = (activity: Activity) => {
    if (activity.type === "game") {
      return activity.result === "win" ? "text-green-600" : "text-red-600";
    }
    if (activity.type === "deposit") return "text-blue-600";
    if (activity.type === "withdrawal") return "text-orange-600";
    return "text-purple-600";
  };

  const getAmountColor = (activity: Activity) => {
    if (activity.type === "game" && activity.result === "loss") return "text-red-600";
    if (activity.type === "withdrawal") return "text-orange-600";
    return "text-green-600";
  };

  return (
    <Card className="p-4">
      <h3 className="font-bold text-lg mb-4">Recent Activity</h3>
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {activities.map((activity, index) => {
            const Icon = getActivityIcon(activity);
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`size-10 rounded-full bg-muted flex items-center justify-center ${getActivityColor(activity)}`}>
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${getAmountColor(activity)}`}>
                    {activity.amount > 0 ? "+" : ""}${activity.amount.toFixed(2)}
                  </p>
                  {activity.result && (
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        activity.result === "win"
                          ? "border-green-500/50 text-green-600"
                          : "border-red-500/50 text-red-600"
                      }`}
                    >
                      {activity.result.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}

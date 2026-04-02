import { motion } from "motion/react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Users, DollarSign, Clock, Coins } from "lucide-react";

export interface GameData {
  id: string;
  gameCode: string;
  gameType: "blackjack" | "pool" | "darts";
  stakeAmount: number;
  totalPot: number;
  status: "waiting" | "in_progress" | "completed";
  creator: {
    id: string;
    username: string;
  };
  currentPlayers: number;
  maxPlayers: number;
  createdAt: string;
}

interface GameCardProps {
  game: GameData;
  onJoin: (gameId: string) => void;
  isJoining?: boolean;
}

const gameIcons: Record<GameData["gameType"], string> = {
  blackjack: "🃏",
  pool: "🎱",
  darts: "🎯",
};

const gameNames: Record<GameData["gameType"], string> = {
  blackjack: "Blackjack",
  pool: "8-Ball Pool",
  darts: "Darts",
};

export function GameCard({ game, onJoin, isJoining }: GameCardProps) {
  const getStatusColor = (status: GameData["status"]) => {
    switch (status) {
      case "waiting":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "in_progress":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "completed":
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  const getStatusText = (status: GameData["status"]) => {
    switch (status) {
      case "waiting":
        return "Waiting for Players";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -2 }}
    >
      <Card className="p-4 hover:shadow-lg transition-all duration-300 border-2">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
              {gameIcons[game.gameType]}
            </div>
            <div>
              <h3 className="font-bold text-lg">{gameNames[game.gameType]}</h3>
              <p className="text-xs text-muted-foreground">#{game.gameCode}</p>
            </div>
          </div>
          <Badge className={getStatusColor(game.status)}>
            {getStatusText(game.status)}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <DollarSign className="size-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Stake</span>
            </div>
            <span className="font-bold text-lg">${game.stakeAmount.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
              <Coins className="size-4 text-orange-600" />
              <div>
                <p className="text-xs text-muted-foreground">Total Pot</p>
                <p className="font-semibold text-sm">${game.totalPot.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
              <Users className="size-4 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Players</p>
                <p className="font-semibold text-sm">
                  {game.currentPlayers}/{game.maxPlayers}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t">
            <Avatar className="size-6">
              <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                {game.creator.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              Created by <span className="font-semibold text-foreground">{game.creator.username}</span>
            </span>
          </div>

          {game.status === "waiting" && (
            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={() => onJoin(game.id)}
              disabled={isJoining}
            >
              {isJoining ? "Joining..." : `Join Game - $${game.stakeAmount.toFixed(2)}`}
            </Button>
          )}

          {game.status === "in_progress" && (
            <Button className="w-full" variant="outline" disabled>
              Game in Progress
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
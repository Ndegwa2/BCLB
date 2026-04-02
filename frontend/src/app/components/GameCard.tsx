import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Clock, Play, Lock, Eye, Users, DollarSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface GameData {
  id: string;
  gameCode: string;
  gameType: "blackjack" | "pool" | "darts";
  stakeAmount: number;
  totalPot: number;
  status: "waiting" | "active" | "full" | "completed";
  creator: {
    id: string;
    username: string;
    avatar?: string;
    isOnline: boolean;
  };
  opponent?: {
    id: string;
    username: string;
    avatar?: string;
  };
  currentPlayers: number;
  maxPlayers: number;
  createdAt: string;
  startedAt?: string;
  rules?: {
    maxRounds?: number;
    timeLimit?: number;
  };
}

interface GameCardProps {
  game: GameData;
  onJoin: (gameId: string) => void;
  onPlay?: (gameId: string) => void;
  onSpectate?: (gameId: string) => void;
  isJoining?: boolean;
  currentUserId?: string;
  isJoined?: boolean;
}

const gameIcons: Record<GameData["gameType"], { icon: string; name: string; gradient: string }> = {
  blackjack: { 
    icon: "🃏", 
    name: "Blackjack",
    gradient: "from-purple-500 to-pink-500"
  },
  pool: { 
    icon: "🎱", 
    name: "8-Ball Pool",
    gradient: "from-blue-500 to-cyan-500"
  },
  darts: { 
    icon: "🎯", 
    name: "Darts",
    gradient: "from-orange-500 to-red-500"
  },
};

export function GameCard({ game, onJoin, onPlay, onSpectate, isJoining, currentUserId, isJoined }: GameCardProps) {
  const gameInfo = gameIcons[game.gameType];
  
  const getStatusBadge = () => {
    switch (game.status) {
      case "waiting":
        return <span className="badge-waiting">Waiting</span>;
      case "active":
        return <span className="badge-live">Live</span>;
      case "full":
        return <span className="badge-full">Full</span>;
      case "completed":
        return <span className="badge-completed">Completed</span>;
    }
  };

  const isCreator = currentUserId === game.creator.id;
  const canPlay = isCreator || isJoined;

  const getActionButton = () => {
    switch (game.status) {
      case "waiting":
        if (canPlay) {
          return (
            <Button
              className="w-full btn-success"
              onClick={() => onPlay?.(game.id) || onJoin(game.id)}
            >
              <Play className="w-4 h-4 mr-2" />
              Play Now
            </Button>
          );
        }
        return (
          <Button
            className="w-full btn-success"
            onClick={() => onJoin(game.id)}
            disabled={isJoining}
          >
            {isJoining ? (
              <>
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Joining...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                {game.stakeAmount === 0 ? 'Join Free Game' : `Join Game ($${game.stakeAmount.toFixed(2)})`}
              </>
            )}
          </Button>
        );
      case "active":
        if (canPlay) {
          return (
            <Button
              className="w-full btn-success"
              onClick={() => onPlay?.(game.id)}
            >
              <Play className="w-4 h-4 mr-2" />
              Play Now
            </Button>
          );
        }
        return (
          <Button className="w-full" variant="secondary" disabled>
            <Lock className="w-4 h-4 mr-2" />
            Game in Progress
          </Button>
        );
      case "full":
        if (canPlay) {
          return (
            <Button
              className="w-full btn-success"
              onClick={() => onPlay?.(game.id)}
            >
              <Play className="w-4 h-4 mr-2" />
              Play Now
            </Button>
          );
        }
        return (
          <Button
            className="w-full"
            variant="secondary"
            onClick={() => onSpectate?.(game.id)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Game Full - Spectate
          </Button>
        );
      case "completed":
        return (
          <Button className="w-full" variant="secondary" disabled>
            Game Completed
          </Button>
        );
    }
  };

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="card-game"
    >
      {/* Top Row - Status & Game Type */}
      <div className="flex items-start justify-between mb-4">
        {getStatusBadge()}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-xs font-medium text-white/80">
          <span>{gameInfo.icon}</span>
          <span>{gameInfo.name}</span>
        </div>
      </div>

      {/* Game Icon Center */}
      <motion.div 
        className="flex justify-center my-6"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <div 
          className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gameInfo.gradient} flex items-center justify-center text-4xl shadow-lg`}
          style={{ boxShadow: `0 15px 35px rgba(168, 85, 247, 0.3)` }}
        >
          {gameInfo.icon}
        </div>
      </motion.div>

      {/* VS Indicator */}
      <div className="text-center text-sm font-bold text-white/40 my-2">VS</div>

      {/* Players Section */}
      <div className="flex items-center justify-between my-4">
        {/* Creator */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Avatar className="w-10 h-10 border-2 border-purple-500/50">
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm">
                {getInitials(game.creator.username)}
              </AvatarFallback>
            </Avatar>
            {game.creator.isOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-slate-900" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-white truncate max-w-[100px]">
              {game.creator.username}
            </p>
            <p className="text-xs text-white/40">Creator</p>
          </div>
        </div>

        {/* Opponent */}
        <div className="flex items-center gap-2">
          {game.opponent ? (
            <>
              <div>
                <p className="text-sm font-semibold text-white truncate max-w-[100px] text-right">
                  {game.opponent.username}
                </p>
                <p className="text-xs text-white/40 text-right">Opponent</p>
              </div>
              <Avatar className="w-10 h-10 border-2 border-pink-500/50">
                <AvatarFallback className="bg-gradient-to-br from-pink-500 to-orange-500 text-white text-sm">
                  {getInitials(game.opponent.username)}
                </AvatarFallback>
              </Avatar>
            </>
          ) : (
            <>
              <div>
                <p className="text-sm font-semibold text-white/40 text-right">Waiting...</p>
                <p className="text-xs text-white/30 text-right">Opponent</p>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                <span className="text-white/30 text-lg">?</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stakes Info */}
      <div className="flex items-center justify-center gap-4 my-4 py-3 rounded-lg bg-white/5">
        <div className="flex items-center gap-1.5 text-sm text-white/80">
          <DollarSign className="w-4 h-4 text-green-400" />
          <span>Stake: <span className="font-semibold text-white">{game.stakeAmount === 0 ? 'Free' : `$${game.stakeAmount.toFixed(2)}`}</span></span>
        </div>
        <span className="text-white/20">•</span>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="gradient-text-green font-semibold">🏆 Pot: {game.totalPot === 0 ? 'Free' : `$${game.totalPot.toFixed(2)}`}</span>
        </div>
      </div>

      {/* Players Count */}
      <div className="flex items-center justify-center gap-2 text-sm text-white/60 mb-3">
        <Users className="w-4 h-4" />
        <span>{game.currentPlayers}/{game.maxPlayers} Players</span>
      </div>

      {/* Timestamp */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-white/40 mb-4">
        <Clock className="w-3 h-3" />
        <span>Created {formatDistanceToNow(new Date(game.createdAt), { addSuffix: true })}</span>
      </div>

      {/* Action Button */}
      {getActionButton()}
    </motion.div>
  );
}
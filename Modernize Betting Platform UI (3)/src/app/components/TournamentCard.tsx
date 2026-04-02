import { motion } from "motion/react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Users, Trophy, DollarSign, Calendar } from "lucide-react";

export interface TournamentData {
  id: string;
  name: string;
  gameType: "blackjack" | "pool" | "darts";
  entryFee: number;
  maxPlayers: number;
  currentPlayers: number;
  prizePool: number;
  status: "upcoming" | "in_progress" | "completed";
  startDate: string;
}

interface TournamentCardProps {
  tournament: TournamentData;
  onJoin: (tournamentId: string) => void;
}

const gameIcons: Record<TournamentData["gameType"], string> = {
  blackjack: "🃏",
  pool: "🎱",
  darts: "🎯",
};

export function TournamentCard({ tournament, onJoin }: TournamentCardProps) {
  const spotsLeft = tournament.maxPlayers - tournament.currentPlayers;
  const percentFilled = (tournament.currentPlayers / tournament.maxPlayers) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-5 hover:shadow-xl transition-all duration-300 border-2 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 size-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full -mr-16 -mt-16" />

        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="size-14 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-3xl shadow-lg">
                <Trophy className="size-8 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{tournament.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl">{gameIcons[tournament.gameType]}</span>
                  <Badge variant="outline" className="text-xs">
                    {tournament.gameType.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
            <Badge
              className={
                tournament.status === "upcoming"
                  ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                  : tournament.status === "in_progress"
                  ? "bg-green-500/10 text-green-600 border-green-500/20"
                  : "bg-gray-500/10 text-gray-600 border-gray-500/20"
              }
            >
              {tournament.status.replace("_", " ").toUpperCase()}
            </Badge>
          </div>

          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <DollarSign className="size-4 text-purple-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Entry Fee</p>
                  <p className="font-bold">${tournament.entryFee.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <Trophy className="size-4 text-yellow-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Prize Pool</p>
                  <p className="font-bold">${tournament.prizePool.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Players</span>
                </div>
                <span className="font-semibold">
                  {tournament.currentPlayers}/{tournament.maxPlayers}
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentFilled}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {spotsLeft} {spotsLeft === 1 ? "spot" : "spots"} left
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="size-4" />
              <span>{tournament.startDate}</span>
            </div>
          </div>

          {tournament.status === "upcoming" && spotsLeft > 0 && (
            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={() => onJoin(tournament.id)}
            >
              Join Tournament - ${tournament.entryFee.toFixed(2)}
            </Button>
          )}

          {tournament.status === "upcoming" && spotsLeft === 0 && (
            <Button className="w-full" variant="outline" disabled>
              Tournament Full
            </Button>
          )}

          {tournament.status === "in_progress" && (
            <Button className="w-full" variant="outline">
              View Tournament
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

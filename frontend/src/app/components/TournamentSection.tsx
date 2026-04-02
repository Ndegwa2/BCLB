import { useRef } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Trophy, Users, Clock, DollarSign } from "lucide-react";
import { Button } from "./ui/button";
import { format } from "date-fns";

/**
 * Backend API Tournament interface - matches what the backend returns
 * from Tournament.to_dict() in backend/app/models/tournament.py
 */
export interface BackendTournament {
  id: number;
  name: string;
  game_type: string;
  entry_fee: number;
  max_players: number;
  status: string;
  format: string;
  winner_id?: number;
  game_id?: number;
  current_round?: number;
  total_rounds?: number;
  created_at: string;
  updated_at: string;
  entries?: Array<{
    id: number;
    tournament_id: number;
    user_id: number;
    joined_at: string;
    status: string;
  }>;
  player_count?: number;
}

/**
 * Frontend Tournament interface - matches what TournamentSection expects
 * This is the transformed/normalized version for UI display
 */
export interface TournamentData {
  id: string;
  name: string;
  prizePool: number;
  entryFee: number;
  currentPlayers: number;
  maxPlayers: number;
  startTime: string;
  format: string;
  gameType: "blackjack" | "pool" | "darts";
  status: "registration" | "starting" | "in_progress" | "completed";
  bannerGradient?: string;
}

/**
 * Transform backend tournament data to frontend format
 * Maps backend field names to frontend expected field names
 */
export function transformBackendTournament(backendTournament: BackendTournament): TournamentData {
  // Map backend game_type to frontend gameType
  const gameTypeMap: Record<string, "blackjack" | "pool" | "darts"> = {
    'card_blackjack': 'blackjack',
    'pool_8ball': 'pool',
    'draw_1v1': 'darts', // Using darts as fallback for draw games
  };

  // Map backend status to frontend status
  const statusMap: Record<string, "registration" | "starting" | "in_progress" | "completed"> = {
    'open': 'registration',
    'in_progress': 'in_progress',
    'completed': 'completed',
    'cancelled': 'completed',
    'paused': 'starting',
  };

  // Calculate prize pool (85% of total entry fees)
  const playerCount = backendTournament.entries?.length || backendTournament.player_count || 0;
  const prizePool = playerCount * backendTournament.entry_fee * 0.85;

  return {
    id: String(backendTournament.id),
    name: backendTournament.name,
    prizePool,
    entryFee: backendTournament.entry_fee,
    currentPlayers: playerCount,
    maxPlayers: backendTournament.max_players,
    startTime: backendTournament.created_at,
    format: backendTournament.format.replace('_', ' '),
    gameType: gameTypeMap[backendTournament.game_type] || 'darts',
    status: statusMap[backendTournament.status] || 'registration',
  };
}

interface TournamentSectionProps {
  tournaments: TournamentData[];
  onJoinTournament: (tournamentId: string) => void;
  joiningTournamentId?: string | null;
}

const gameGradients: Record<string, string> = {
  blackjack: "from-purple-600 via-pink-600 to-purple-800",
  pool: "from-blue-600 via-cyan-600 to-blue-800",
  darts: "from-orange-600 via-red-600 to-orange-800",
};

const gameIcons: Record<string, string> = {
  blackjack: "🃏",
  pool: "🎱",
  darts: "🎯",
};

export function TournamentSection({ tournaments, onJoinTournament, joiningTournamentId }: TournamentSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 380;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const getStatusBadge = (status: TournamentData["status"]) => {
    switch (status) {
      case "registration":
        return <span className="badge-waiting">Open</span>;
      case "starting":
        return <span className="badge-live">Starting Soon</span>;
      case "in_progress":
        return <span className="badge-live">In Progress</span>;
      case "completed":
        return <span className="badge-completed">Completed</span>;
    }
  };

  const getButtonText = (tournament: TournamentData) => {
    switch (tournament.status) {
      case "registration":
        return `Join Now - $${tournament.entryFee.toFixed(2)}`;
      case "starting":
        return "Tournament Starting";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "View Results";
    }
  };

  const isJoinDisabled = (tournament: TournamentData) => {
    return tournament.status !== "registration" || 
           tournament.currentPlayers >= tournament.maxPlayers ||
           joiningTournamentId === tournament.id;
  };

  if (tournaments.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Tournaments
          </h2>
        </div>
        <div className="glass-card p-12 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-xl font-semibold text-white mb-2">No active tournaments</h3>
          <p className="text-white/60">Check back soon for exciting tournaments!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          Tournaments
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => scroll("left")}
            className="hidden sm:flex"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => scroll("right")}
            className="hidden sm:flex"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tournament Carousel */}
      <div
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide scroll-snap-x pb-4 -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {tournaments.map((tournament, index) => (
          <motion.div
            key={tournament.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="tournament-card flex-shrink-0 w-[360px] scroll-snap-start"
          >
            {/* Banner Section */}
            <div 
              className={`h-40 bg-gradient-to-br ${tournament.bannerGradient || gameGradients[tournament.gameType]} relative overflow-hidden`}
            >
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              
              {/* Content */}
              <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
                <div className="flex items-start justify-between">
                  <span className="text-4xl">{gameIcons[tournament.gameType]}</span>
                  {getStatusBadge(tournament.status)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 truncate">{tournament.name}</h3>
                  <div className="flex items-center gap-2 text-green-300">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-lg font-semibold">${tournament.prizePool.toLocaleString()} Prize Pool</span>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white/10 blur-xl" />
            </div>

            {/* Info Section */}
            <div className="p-5 space-y-4 bg-white/5">
              {/* Entry Fee */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/60">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm">Entry Fee</span>
                </div>
                <span className="font-semibold text-white">${tournament.entryFee.toFixed(2)}</span>
              </div>

              {/* Players */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/60">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Players</span>
                  </div>
                  <span className="font-semibold text-white">
                    {tournament.currentPlayers}/{tournament.maxPlayers}
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${(tournament.currentPlayers / tournament.maxPlayers) * 100}%` }}
                  />
                </div>
              </div>

              {/* Start Time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/60">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Starts</span>
                </div>
                <span className="font-semibold text-white text-sm">
                  {format(new Date(tournament.startTime), "MMM d, yyyy h:mm a")}
                </span>
              </div>

              {/* Format */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/60">
                  <Trophy className="w-4 h-4" />
                  <span className="text-sm">Format</span>
                </div>
                <span className="font-semibold text-white text-sm">{tournament.format}</span>
              </div>

              {/* Join Button */}
              <Button
                className={`w-full ${
                  tournament.status === "registration" && tournament.currentPlayers < tournament.maxPlayers
                    ? "btn-success"
                    : "btn-secondary"
                }`}
                onClick={() => onJoinTournament(tournament.id)}
                disabled={isJoinDisabled(tournament)}
              >
                {joiningTournamentId === tournament.id ? (
                  <>
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Registering...
                  </>
                ) : (
                  getButtonText(tournament)
                )}
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, ChevronDown, SlidersHorizontal } from "lucide-react";
import { Button } from "./ui/button";
import { GameCard, GameData } from "./GameCard";

interface GameLobbyProps {
  games: GameData[];
  onJoinGame: (gameId: string) => void;
  onSpectateGame?: (gameId: string) => void;
  joiningGameId?: string | null;
  currentUserId?: string;
}

const tabs = [
  { id: "all", label: "All Games" },
  { id: "blackjack", label: "Blackjack" },
  { id: "pool", label: "Pool" },
  { id: "darts", label: "Darts" },
  { id: "my-active", label: "My Active" },
];

const stakeRanges = [
  { id: "all", label: "All Stakes" },
  { id: "low", label: "$0 - $10", min: 0, max: 10 },
  { id: "medium", label: "$10 - $50", min: 10, max: 50 },
  { id: "high", label: "$50+", min: 50, max: Infinity },
];

const sortOptions = [
  { id: "newest", label: "Newest" },
  { id: "highest-stakes", label: "Highest Stakes" },
  { id: "almost-full", label: "Almost Full" },
];

export function GameLobby({ games, onJoinGame, onSpectateGame, joiningGameId, currentUserId }: GameLobbyProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [stakeFilter, setStakeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  const filteredGames = useMemo(() => {
    let result = [...games];

    // Filter by tab
    if (activeTab !== "all" && activeTab !== "my-active") {
      result = result.filter(game => game.gameType === activeTab);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(game => 
        game.gameCode.toLowerCase().includes(query) ||
        game.creator.username.toLowerCase().includes(query) ||
        game.gameType.toLowerCase().includes(query) ||
        (game.opponent?.username.toLowerCase().includes(query))
      );
    }

    // Filter by stake range
    if (stakeFilter !== "all") {
      const range = stakeRanges.find(r => r.id === stakeFilter);
      if (range) {
        result = result.filter(game => 
          game.stakeAmount >= (range.min || 0) && 
          game.stakeAmount < (range.max || Infinity)
        );
      }
    }

    // Sort
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "highest-stakes":
        result.sort((a, b) => b.stakeAmount - a.stakeAmount);
        break;
      case "almost-full":
        result.sort((a, b) => (b.currentPlayers / b.maxPlayers) - (a.currentPlayers / a.maxPlayers));
        break;
    }

    return result;
  }, [games, activeTab, searchQuery, stakeFilter, sortBy]);

  const gameCounts = useMemo(() => {
    return {
      all: games.length,
      blackjack: games.filter(g => g.gameType === "blackjack").length,
      pool: games.filter(g => g.gameType === "pool").length,
      darts: games.filter(g => g.gameType === "darts").length,
      "my-active": games.filter(g => g.status === "active").length,
    };
  }, [games]);

  return (
    <div className="space-y-6">
      {/* Tab System */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              {tab.label}
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-white/10 text-xs">
                {gameCounts[tab.id as keyof typeof gameCounts]}
              </span>
            </button>
          ))}
        </div>

        {/* Filter Toggle */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </Button>
      </div>

      {/* Filters Section */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-4 flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search games by code, player, or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-dark pl-10"
                />
              </div>

              {/* Stake Filter */}
              <div className="relative">
                <select
                  value={stakeFilter}
                  onChange={(e) => setStakeFilter(e.target.value)}
                  className="input-dark pr-10 appearance-none cursor-pointer min-w-[150px]"
                >
                  {stakeRanges.map((range) => (
                    <option key={range.id} value={range.id}>
                      {range.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              </div>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input-dark pr-10 appearance-none cursor-pointer min-w-[150px]"
                >
                  {sortOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Games Grid */}
      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <GameCard
                game={game}
                onJoin={onJoinGame}
                onSpectate={onSpectateGame}
                isJoining={joiningGameId === game.id}
                currentUserId={currentUserId}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-12 text-center"
        >
          <div className="text-6xl mb-4">🎮</div>
          <h3 className="text-xl font-semibold text-white mb-2">No games found</h3>
          <p className="text-white/60 mb-6">
            {searchQuery || stakeFilter !== "all"
              ? "Try adjusting your filters to find more games"
              : "Be the first to create a game!"}
          </p>
          {(searchQuery || stakeFilter !== "all") && (
            <Button
              variant="secondary"
              onClick={() => {
                setSearchQuery("");
                setStakeFilter("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </motion.div>
      )}

      {/* Results Count */}
      {filteredGames.length > 0 && (
        <div className="text-center text-sm text-white/40">
          Showing {filteredGames.length} of {games.length} games
        </div>
      )}
    </div>
  );
}
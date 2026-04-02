import { useState } from "react";
import { Header } from "./components/Header";
import { GameCard, GameData } from "./components/GameCard";
import { TournamentCard, TournamentData } from "./components/TournamentCard";
import { CreateGameModal } from "./components/CreateGameModal";
import { DepositModal } from "./components/DepositModal";
import { StatsCards } from "./components/StatsCards";
import { RecentActivity } from "./components/RecentActivity";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Search, Filter, Gamepad2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import { motion } from "motion/react";

// Mock data
const mockGames: GameData[] = [
  {
    id: "1",
    gameCode: "BJ4829",
    gameType: "blackjack",
    stakeAmount: 25,
    totalPot: 50,
    status: "waiting",
    creator: { id: "1", username: "ProGamer123" },
    currentPlayers: 1,
    maxPlayers: 2,
    createdAt: "2 mins ago",
  },
  {
    id: "2",
    gameCode: "PL9281",
    gameType: "pool",
    stakeAmount: 50,
    totalPot: 100,
    status: "waiting",
    creator: { id: "2", username: "PoolMaster" },
    currentPlayers: 1,
    maxPlayers: 2,
    createdAt: "5 mins ago",
  },
  {
    id: "3",
    gameCode: "DT3721",
    gameType: "darts",
    stakeAmount: 10,
    totalPot: 20,
    status: "waiting",
    creator: { id: "3", username: "BullseyeKing" },
    currentPlayers: 1,
    maxPlayers: 2,
    createdAt: "8 mins ago",
  },
  {
    id: "4",
    gameCode: "BJ7654",
    gameType: "blackjack",
    stakeAmount: 100,
    totalPot: 200,
    status: "in_progress",
    creator: { id: "4", username: "HighRoller" },
    currentPlayers: 2,
    maxPlayers: 2,
    createdAt: "12 mins ago",
  },
];

const mockTournaments: TournamentData[] = [
  {
    id: "1",
    name: "Weekly Blackjack Championship",
    gameType: "blackjack",
    entryFee: 50,
    maxPlayers: 16,
    currentPlayers: 12,
    prizePool: 800,
    status: "upcoming",
    startDate: "Tomorrow, 8:00 PM",
  },
  {
    id: "2",
    name: "8-Ball Pool Masters",
    gameType: "pool",
    entryFee: 25,
    maxPlayers: 8,
    currentPlayers: 6,
    prizePool: 200,
    status: "upcoming",
    startDate: "Today, 9:00 PM",
  },
  {
    id: "3",
    name: "Darts Pro League",
    gameType: "darts",
    entryFee: 20,
    maxPlayers: 12,
    currentPlayers: 8,
    prizePool: 240,
    status: "in_progress",
    startDate: "Now",
  },
];

const mockActivities = [
  {
    id: "1",
    type: "game" as const,
    description: "Blackjack vs ProGamer123",
    amount: 50,
    result: "win" as const,
    timestamp: "5 mins ago",
  },
  {
    id: "2",
    type: "deposit" as const,
    description: "Deposit via M-Pesa",
    amount: 100,
    timestamp: "1 hour ago",
  },
  {
    id: "3",
    type: "game" as const,
    description: "8-Ball Pool vs PoolMaster",
    amount: -25,
    result: "loss" as const,
    timestamp: "2 hours ago",
  },
  {
    id: "4",
    type: "tournament" as const,
    description: "Joined Darts Pro League",
    amount: -20,
    timestamp: "3 hours ago",
  },
  {
    id: "5",
    type: "game" as const,
    description: "Darts vs BullseyeKing",
    amount: 20,
    result: "win" as const,
    timestamp: "5 hours ago",
  },
];

export default function App() {
  const [balance, setBalance] = useState(1248.75);
  const [games, setGames] = useState<GameData[]>(mockGames);
  const [createGameOpen, setCreateGameOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const stats = {
    totalGamesPlayed: 127,
    totalWins: 84,
    winRate: 66,
    totalEarnings: 2450.5,
  };

  const handleCreateGame = (gameType: string, stakeAmount: number) => {
    const newGame: GameData = {
      id: Date.now().toString(),
      gameCode: `${gameType.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 10000)}`,
      gameType: gameType as GameData["gameType"],
      stakeAmount,
      totalPot: stakeAmount * 2,
      status: "waiting",
      creator: { id: "current-user", username: "You" },
      currentPlayers: 1,
      maxPlayers: 2,
      createdAt: "Just now",
    };

    setGames([newGame, ...games]);
    setBalance(balance - stakeAmount);
    toast.success("Game created successfully! Waiting for opponent...");
  };

  const handleJoinGame = (gameId: string) => {
    const game = games.find((g) => g.id === gameId);
    if (!game) return;

    if (balance < game.stakeAmount) {
      toast.error("Insufficient balance");
      return;
    }

    setGames(
      games.map((g) =>
        g.id === gameId
          ? { ...g, currentPlayers: g.currentPlayers + 1, status: "in_progress" as const }
          : g
      )
    );
    setBalance(balance - game.stakeAmount);
    toast.success(`Joined ${game.gameType} game! Good luck!`);
  };

  const handleJoinTournament = (tournamentId: string) => {
    const tournament = mockTournaments.find((t) => t.id === tournamentId);
    if (!tournament) return;

    if (balance < tournament.entryFee) {
      toast.error("Insufficient balance");
      return;
    }

    setBalance(balance - tournament.entryFee);
    toast.success(`Joined ${tournament.name}!`);
  };

  const handleDeposit = (amount: number, method: string) => {
    setBalance(balance + amount);
    toast.success(`Successfully deposited $${amount.toFixed(2)} via ${method}!`);
  };

  const filteredGames = games.filter((game) => {
    const matchesType = filterType === "all" || game.gameType === filterType;
    const matchesSearch =
      game.gameCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.creator.username.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" richColors />
      
      <Header
        balance={balance}
        onMenuClick={() => {}}
        onCreateGame={() => setCreateGameOpen(true)}
        onDeposit={() => setDepositOpen(true)}
      />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 p-6 md:p-8 text-white"
        >
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Welcome back, Player! 👋
            </h1>
            <p className="text-lg text-white/90 mb-4">
              Ready to compete and win? Join a game or create your own!
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setCreateGameOpen(true)}
                className="bg-white text-purple-600 hover:bg-white/90"
              >
                <Gamepad2 className="size-4 mr-2" />
                Create Game
              </Button>
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white/20"
              >
                View Tournaments
              </Button>
            </div>
          </div>
          <div className="absolute top-0 right-0 size-64 bg-white/10 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 right-20 size-32 bg-white/10 rounded-full" />
        </motion.div>

        {/* Stats */}
        <StatsCards stats={stats} />

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="games" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="games">Available Games</TabsTrigger>
                <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
              </TabsList>

              <TabsContent value="games" className="space-y-4 mt-6">
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by game code or player..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={filterType === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterType("all")}
                    >
                      All
                    </Button>
                    <Button
                      variant={filterType === "blackjack" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterType("blackjack")}
                    >
                      🃏 Blackjack
                    </Button>
                    <Button
                      variant={filterType === "pool" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterType("pool")}
                    >
                      🎱 Pool
                    </Button>
                    <Button
                      variant={filterType === "darts" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterType("darts")}
                    >
                      🎯 Darts
                    </Button>
                  </div>
                </div>

                {/* Games Grid */}
                <div className="grid gap-4">
                  {filteredGames.map((game) => (
                    <GameCard key={game.id} game={game} onJoin={handleJoinGame} />
                  ))}
                  {filteredGames.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No games found</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setCreateGameOpen(true)}
                      >
                        Create a Game
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="tournaments" className="space-y-4 mt-6">
                <div className="grid gap-4">
                  {mockTournaments.map((tournament) => (
                    <TournamentCard
                      key={tournament.id}
                      tournament={tournament}
                      onJoin={handleJoinTournament}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <RecentActivity activities={mockActivities} />
          </div>
        </div>
      </main>

      <CreateGameModal
        open={createGameOpen}
        onClose={() => setCreateGameOpen(false)}
        onCreateGame={handleCreateGame}
        balance={balance}
      />

      <DepositModal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        onDeposit={handleDeposit}
      />
    </div>
  );
}

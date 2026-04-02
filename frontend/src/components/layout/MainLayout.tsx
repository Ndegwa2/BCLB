import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useWallet } from '../../contexts/WalletContext'
import { useGame } from '../../contexts/GameContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { Header } from '../../app/components/Header'
import { StatsCards } from '../../app/components/StatsCards'
import { GameLobby } from '../../app/components/GameLobby'
import { TournamentSection, transformBackendTournament, BackendTournament } from '../../app/components/TournamentSection'
import { RecentActivity, ActivityItem } from '../../app/components/RecentActivity'
import { CreateGameModal, CreateGameData } from '../../app/components/CreateGameModal'
import { DepositModal } from '../../app/components/DepositModal'
import { FAB } from '../../app/components/FAB'
import { GameCardSkeleton, StatCardSkeleton, TournamentCardSkeleton, ActivityItemSkeleton } from '../../app/components/ui/skeleton'
import { apiClient } from '../../services/api'
import { toast } from 'sonner'

interface MainLayoutProps {
  children?: React.ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { state: authState, logout } = useAuth()
  const { balance, refreshWallet } = useWallet()
  const { gameHistory, activeGames, refreshGameData, loading: gameLoading } = useGame()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Determine active tab based on current route
  const getActiveTab = () => {
    const path = location.pathname
    if (path === '/dashboard') return 'lobby'
    if (path === '/tournaments') return 'tournaments'
    if (path === '/games') return 'my-games'
    if (path === '/play-vs-ai') return 'leaderboard'
    return 'lobby'
  }
  
  const [activeTab, setActiveTab] = useState(getActiveTab())
  
  // Update active tab when route changes
  useEffect(() => {
    setActiveTab(getActiveTab())
  }, [location.pathname])
  const [showCreateGameModal, setShowCreateGameModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [joiningGameId, setJoiningGameId] = useState<string | null>(null)
  const [joiningTournamentId, setJoiningTournamentId] = useState<string | null>(null)
  const [isCreatingGame, setIsCreatingGame] = useState(false)
  const [activities, setActivities] = useState<ActivityItem[]>([])

  // Mock stats - in real app, fetch from API
  const stats = {
    totalWinnings: 2847.50,
    winRate: 68,
    gamesPlayed: 127,
    activeTournaments: 3,
  }

  // State for real tournaments from API
  const [apiTournaments, setApiTournaments] = useState<any[]>([])
  const [tournamentsLoading, setTournamentsLoading] = useState(false)

  // Fetch tournaments from API
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setTournamentsLoading(true)
        const responseData = await apiClient.get('/tournaments/open', { params: { limit: 10 } })
        const tournaments = responseData.tournaments || responseData.data?.tournaments || []
        setApiTournaments(tournaments)
      } catch (error) {
        console.error('Failed to fetch tournaments:', error)
        // Fallback to mock data if API fails
        setApiTournaments([])
      } finally {
        setTournamentsLoading(false)
      }
    }

    fetchTournaments()
  }, [])

  // Transform backend tournament data for TournamentSection
  const transformedTournaments = apiTournaments.map((tournament: BackendTournament) =>
    transformBackendTournament(tournament)
  )

  // Mock activities - in real app, fetch from API
  useEffect(() => {
    const mockActivities: ActivityItem[] = [
      {
        id: '1',
        type: 'big_win',
        username: 'ProGamer123',
        amount: 500,
        gameType: 'Blackjack',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        type: 'game_win',
        username: 'LuckyPlayer',
        amount: 50,
        gameType: 'Pool',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        type: 'tournament_start' as const,
        username: 'System',
        tournamentName: 'Weekend Championship',
        playerCount: 128,
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        id: '4',
        type: 'game_loss',
        username: 'NewPlayer99',
        amount: 25,
        gameType: 'Darts',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      },
      {
        id: '5',
        type: 'deposit',
        username: 'HighRoller',
        amount: 1000,
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      },
    ]
    setActivities(mockActivities)
  }, [])

  const handleJoinGame = async (gameId: string) => {
    try {
      setJoiningGameId(gameId)
      await apiClient.post(`/games/${gameId}/join`)
      toast.success('Successfully joined the game!')
      await refreshGameData()
      navigate(`/games/play/${gameId}`)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to join game')
    } finally {
      setJoiningGameId(null)
    }
  }

  const handleJoinTournament = async (tournamentId: string) => {
    try {
      setJoiningTournamentId(tournamentId)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success('Successfully registered for tournament!')
    } catch (error: any) {
      toast.error('Failed to join tournament')
    } finally {
      setJoiningTournamentId(null)
    }
  }

  const handleCreateGame = async (data: CreateGameData) => {
    try {
      setIsCreatingGame(true)
      
      // Map frontend game types to backend game types
      const gameTypeMap: Record<string, string> = {
        'blackjack': 'card_blackjack',
        'pool': 'pool_8ball',
        'darts': 'draw_1v1',
      }
      
      // apiClient already returns response.data, so we access directly
      const responseData = await apiClient.post('/games', {
        game_type: gameTypeMap[data.gameType] || data.gameType,
        stake_amount: data.stakeAmount,
        allow_ai: data.allowAI,
        ai_difficulty: data.allowAI ? data.aiDifficulty : undefined,
      })
      const game = responseData.game || responseData.data?.game
      toast.success(`Game created! Code: ${game.game_code}`)
      setShowCreateGameModal(false)
      await refreshGameData()
      await refreshWallet()
      
      // Navigate to the game page for all games (AI or human)
      navigate(`/games/play/${game.id}`)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create game')
    } finally {
      setIsCreatingGame(false)
    }
  }

  const handleDepositSuccess = async () => {
    toast.success('Deposit successful!')
    await refreshWallet()
    setShowDepositModal(false)
  }

  const handleProfile = () => navigate('/profile')
  const handleLogout = () => logout()

  // Transform games data for GameLobby
  const allGames = [...activeGames, ...gameHistory]
  const transformedGames = allGames.map((game: any) => {
    // Map backend game types to frontend game types
    const gameTypeMap: Record<string, 'blackjack' | 'pool' | 'darts'> = {
      'card_blackjack': 'blackjack',
      'pool_8ball': 'pool',
      'draw_1v1': 'darts',
    }
    
    return {
      id: game.id.toString(),
      gameCode: game.game_code || `GAME${game.id}`,
      gameType: gameTypeMap[game.game_type] || 'blackjack',
      stakeAmount: game.stake_amount || 0,
      totalPot: (game.stake_amount || 0) * 2,
      status: game.status === 'waiting' ? 'waiting' as const :
              game.status === 'in_progress' ? 'active' as const :
              game.status === 'completed' ? 'completed' as const : 'waiting' as const,
      creator: {
        id: game.creator?.id?.toString() || '1',
        username: game.creator?.username || 'Player',
        isOnline: true,
      },
      opponent: game.opponent ? {
        id: game.opponent.id?.toString(),
        username: game.opponent.username,
      } : undefined,
      currentPlayers: game.current_players || 1,
      maxPlayers: game.max_players || 2,
      createdAt: game.created_at || new Date().toISOString(),
    }
  })

  // If children are provided, render them (for dashboard pages)
  // Otherwise render the default lobby layout
  if (children) {
    return (
      <div className="min-h-screen bg-slate-950 relative">
        {/* Background Effects */}
        <div className="bg-orbs" />
        <div className="grid-pattern" />

        {/* Header */}
        <Header
          balance={balance}
          username={authState.user?.username}
          onMenuClick={() => {}}
          onCreateGame={() => setShowCreateGameModal(true)}
          onDeposit={() => setShowDepositModal(true)}
          onProfile={handleProfile}
          onLogout={handleLogout}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Render children (dashboard content) */}
        <main className="relative z-10">
          {children}
        </main>

        {/* Floating Action Button */}
        <FAB onClick={() => setShowCreateGameModal(true)} />

        {/* Create Game Modal */}
        <CreateGameModal
          isOpen={showCreateGameModal}
          onClose={() => setShowCreateGameModal(false)}
          onCreateGame={handleCreateGame}
          userBalance={balance}
          isCreating={isCreatingGame}
        />

        {/* Deposit Modal */}
        <DepositModal
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          onSuccess={handleDepositSuccess}
          currentBalance={balance}
        />
      </div>
    )
  }

  // Default lobby layout (when no children provided)
  return (
    <div className="min-h-screen bg-slate-950 relative">
      {/* Background Effects */}
      <div className="bg-orbs" />
      <div className="grid-pattern" />

      {/* Header */}
      <Header
        balance={balance}
        username={authState.user?.username}
        onMenuClick={() => {}}
        onCreateGame={() => setShowCreateGameModal(true)}
        onDeposit={() => setShowDepositModal(true)}
        onProfile={handleProfile}
        onLogout={handleLogout}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Content */}
      <main className="relative z-10 container mx-auto max-w-7xl px-4 py-6">
        {/* Stats Cards */}
        <section className="mb-8">
          {gameLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <StatsCards stats={stats} />
          )}
        </section>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content Area - 3 columns */}
          <div className="lg:col-span-3 space-y-8">
            {/* Tournaments Section */}
            <section>
              {gameLoading || tournamentsLoading ? (
                <div className="flex gap-6 overflow-hidden">
                  {[...Array(3)].map((_, i) => (
                    <TournamentCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <TournamentSection
                  tournaments={transformedTournaments.length > 0 ? transformedTournaments : []}
                  onJoinTournament={handleJoinTournament}
                  joiningTournamentId={joiningTournamentId}
                />
              )}
            </section>

            {/* Game Lobby */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Game Lobby</h2>
              {gameLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <GameCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <GameLobby
                  games={transformedGames}
                  onJoinGame={handleJoinGame}
                  joiningGameId={joiningGameId}
                  currentUserId={authState.user?.id?.toString()}
                />
              )}
            </section>
          </div>

          {/* Sidebar - Activity Feed */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24">
              {gameLoading ? (
                <div className="glass-card p-4 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <ActivityItemSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <RecentActivity activities={activities} />
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* Floating Action Button */}
      <FAB onClick={() => setShowCreateGameModal(true)} />

      {/* Create Game Modal */}
      <CreateGameModal
        isOpen={showCreateGameModal}
        onClose={() => setShowCreateGameModal(false)}
        onCreateGame={handleCreateGame}
        userBalance={balance}
        isCreating={isCreatingGame}
      />

      {/* Deposit Modal */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onSuccess={handleDepositSuccess}
        currentBalance={balance}
      />
    </div>
  )
}

export default MainLayout
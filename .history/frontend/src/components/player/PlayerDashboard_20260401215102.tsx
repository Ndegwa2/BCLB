import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useWallet } from '../../contexts/WalletContext'
import { useGame } from '../../contexts/GameContext'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../services/api'
import DashboardCard from './DashboardCard'
import GameHistoryTable from './GameHistoryTable'
import PlayerSidebar from './PlayerSidebar'


const PlayerDashboard: React.FC = () => {
  const { state: authState, logout } = useAuth()
  const {
    balance,
    recentPayment,
    loading: walletLoading,
    error: walletError
  } = useWallet()
  const {
    gameHistory,
    activeGames,
    upcomingTournaments,
    loading: gameLoading,
    error: gameError,
    refreshGameData
  } = useGame()
  const navigate = useNavigate()
  const [creatingGame, setCreatingGame] = useState(false)

  // Handle "Play Your First Game" button click
  const handlePlayFirstGame = async () => {
    try {
      setCreatingGame(true)

      // Create a new pool game
      const response = await apiClient.post('/games', {
        game_type: 'pool_8ball',
        stake_amount: 0, // Free game for first time
        is_free: true
      })

      const newGame = response.data.game

      // Refresh game data to include the new game
      await refreshGameData()

      // Navigate to the new game
      navigate(`/games/play/${newGame.id}`)

    } catch (error) {
      console.error('Error creating game:', error)
      alert('Failed to create game. Please try again.')
    } finally {
      setCreatingGame(false)
    }
  }

  // Format game history for the table
  const formatGameHistory = () => {
    return gameHistory.slice(0, 3).map((game, index) => {
      const date = new Date(game.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: game.created_at.includes('2024') ? 'numeric' : undefined
      })

      // Format game type for display
      let gameDisplayName = ''
      switch (game.game_type) {
        case 'draw_1v1':
          gameDisplayName = 'Poker'
          break
        case 'pool_8ball':
          gameDisplayName = 'Chess'
          break
        case 'card_blackjack':
          gameDisplayName = 'Blackjack'
          break
        default:
          gameDisplayName = game.game_type
      }

      return {
        id: game.id.toString(),
        game: gameDisplayName,
        date: index === 0 ? 'Today' : index === 1 ? 'Yesterday' : date,
        result: game.my_entry?.result || 'loss'
      }
    })
  }

  // Loading state
  if (walletLoading || gameLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="player-dashboard min-h-screen bg-slate-900 dashboard-transition">
      <div className="flex h-full">
        {/* Sidebar */}
        <PlayerSidebar className="hidden lg:block" />

        {/* Main Content */}
        <div className="main-content flex-1">
          <div className="p-6 space-y-8">
            {/* Header */}
            <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Player Dashboard</h1>
                {walletError && (
                  <p className="text-red-400 text-sm">{walletError}</p>
                )}
                {gameError && (
                  <p className="text-red-400 text-sm">{gameError}</p>
                )}
              </div>

              {/* Avatar */}
              <div className="flex items-center space-x-4 order-first lg:order-last">
                <div className="text-right">
                  <div className="text-white font-semibold">
                    {authState.user?.username || 'Player'}
                  </div>
                  <div className="text-slate-400 text-sm">Level 42</div>
                </div>
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                  <div className="relative">
                    {/* Avatar face */}
                    <div className="w-8 h-8 bg-yellow-400 rounded-full"></div>
                    <div className="w-4 h-4 bg-orange-300 rounded-full absolute -top-1 left-1"></div>
                    <div className="w-8 h-4 bg-orange-400 rounded-full absolute -bottom-1 left-0"></div>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </header>

            {/* Summary Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Balance Card */}
              <DashboardCard
                title="Balance"
                value={`${balance.toFixed(2)}`}
                gradient="blue"
                className="h-40 dashboard-transition"
              />

              {/* Recent Payment Card */}
              <DashboardCard
                title="Recent Payment"
                value={`${recentPayment.toFixed(2)}`}
                gradient="green"
                className="h-40 dashboard-transition"
              />
            </div>

            {/* Active Games and Tournaments Row */}
            <div className="card-dark bg-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-slate-300 text-lg font-semibold mb-4">Active Games</h3>
                  <p className="text-white text-5xl font-bold">{activeGames.length}</p>
                </div>

                <div>
                  <h3 className="text-slate-300 text-lg font-semibold mb-4">Upcoming Tournaments</h3>
                  <p className="text-white text-5xl font-bold">{upcomingTournaments.length}</p>
                </div>
              </div>
            </div>

            {/* Game History Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Game History</h2>

              {gameHistory.length > 0 ? (
                <GameHistoryTable
                  games={formatGameHistory()}
                  className="w-full dashboard-transition"
                />
              ) : (
                <div className="bg-slate-900 rounded-2xl p-8 text-center">
                  <p className="text-slate-400 text-lg">No game history available</p>
                  <button
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-800"
                    onClick={handlePlayFirstGame}
                    disabled={creatingGame}
                  >
                    {creatingGame ? 'Creating Game...' : 'Play Your First Game'}
                  </button>
                </div>
              )}
            </div>

            {/* Upcoming Tournaments Preview */}
            {upcomingTournaments.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white">Upcoming Tournaments</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {upcomingTournaments.map((tournament) => (
                    <div
                      key={tournament.id}
                      className="card-dark bg-slate-800 rounded-2xl p-6 shadow-xl hover:bg-slate-750 transition-colors cursor-pointer dashboard-transition"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-white font-semibold text-lg">{tournament.name}</h3>
                        <div className="text-emerald-400 font-bold text-lg">{tournament.prize}</div>
                      </div>
                      <p className="text-slate-300">{new Date(tournament.date).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation (if needed) */}
      <div className="mobile-nav hidden lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 p-2 flex justify-around">
        {/* Mobile navigation content would go here */}
      </div>
    </div>
  )
}

export default PlayerDashboard
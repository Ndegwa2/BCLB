import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useWallet } from '../../contexts/WalletContext'
import { useGame } from '../../contexts/GameContext'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Wallet,
  TrendingUp,
  Gamepad2,
  Trophy,
  Clock,
  Plus,
  LogOut,
  Sparkles,
  Target,
  Zap
} from 'lucide-react'
import { apiClient } from '../../services/api'
import { toast } from 'sonner'
import DashboardCard from './DashboardCard'
import GameHistoryTable from './GameHistoryTable'
import PlayerSidebar from './PlayerSidebar'

const PlayerDashboard: React.FC = () => {
  const { state: authState, logout } = useAuth()
  const {
    balance,
    availableBalance,
    lockedBalance,
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

  const handlePlayFirstGame = async () => {
    try {
      setCreatingGame(true)
      const response = await apiClient.post('/games', {
        game_type: 'pool_8ball',
        stake_amount: 0,
        allow_ai: true
      })
      const newGame = response.game
      await refreshGameData()
      navigate(`/games/play/${newGame.id}`)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create game')
    } finally {
      setCreatingGame(false)
    }
  }

  const handleQuickDeposit = () => {
    navigate('/wallet')
  }

  const formatGameHistory = () => {
    return gameHistory.slice(0, 5).map((game) => {
      const date = new Date(game.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })

      let gameDisplayName = ''
      switch (game.game_type) {
        case 'draw_1v1':
          gameDisplayName = 'Poker'
          break
        case 'pool_8ball':
          gameDisplayName = 'Pool'
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
        date,
        result: game.my_entry?.result || 'loss',
        stake: game.stake_amount,
        payout: game.my_entry?.result === 'win' ? game.total_pot / 2 : game.stake_amount
      }
    })
  }

  const isLoading = walletLoading || gameLoading

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Sidebar */}
      <PlayerSidebar className="hidden lg:block" />

      {/* Main Content */}
      <div className="lg:ml-64">
        <div className="p-4 md:p-8 space-y-8">
          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Welcome back, <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{authState.user?.username || 'Player'}</span>
              </h1>
              <p className="text-slate-400 text-sm mt-1">Ready to play? Here's your gaming overview</p>
              {(walletError || gameError) && (
                <div className="mt-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-xs">{walletError || gameError}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleQuickDeposit}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/20"
              >
                <Plus className="w-4 h-4" />
                Deposit
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-medium hover:bg-slate-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </header>

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <DashboardCard
              title="Available Balance"
              value={`$${availableBalance.toFixed(2)}`}
              subtitle={`Locked: $${lockedBalance.toFixed(2)}`}
              gradient="green"
              icon={Wallet}
              trend={{ value: 12.5, isPositive: true }}
            />
            <DashboardCard
              title="Total Balance"
              value={`$${balance.toFixed(2)}`}
              subtitle="All funds"
              gradient="blue"
              icon={TrendingUp}
            />
            <DashboardCard
              title="Active Games"
              value={activeGames.length}
              subtitle="In progress"
              gradient="purple"
              icon={Gamepad2}
            />
            <DashboardCard
              title="Tournaments"
              value={upcomingTournaments.length}
              subtitle="Upcoming events"
              gradient="orange"
              icon={Trophy}
            />
          </div>

          {/* Quick Actions */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/play-vs-ai')}
                className="flex flex-col items-center gap-2 p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors border border-slate-700/50"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm text-white font-medium">Play vs AI</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/games')}
                className="flex flex-col items-center gap-2 p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors border border-slate-700/50"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm text-white font-medium">Browse Games</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/tournaments')}
                className="flex flex-col items-center gap-2 p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors border border-slate-700/50"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm text-white font-medium">Tournaments</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleQuickDeposit}
                className="flex flex-col items-center gap-2 p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors border border-slate-700/50"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm text-white font-medium">Deposit</span>
              </motion.button>
            </div>
          </div>

          {/* Game History */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-400" />
                Recent Games
              </h2>
              <button
                onClick={() => navigate('/games')}
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                View All
              </button>
            </div>

            {gameHistory.length > 0 ? (
              <GameHistoryTable
                games={formatGameHistory()}
                className="w-full"
              />
            ) : (
              <div className="glass-card p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No games played yet</h3>
                <p className="text-slate-400 mb-6">Start your gaming journey by playing your first game!</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePlayFirstGame}
                  disabled={creatingGame}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingGame ? 'Creating Game...' : 'Play Your First Game'}
                </motion.button>
              </div>
            )}
          </div>

          {/* Upcoming Tournaments */}
          {upcomingTournaments.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  Upcoming Tournaments
                </h2>
                <button
                  onClick={() => navigate('/tournaments')}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  View All
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingTournaments.map((tournament) => (
                  <motion.div
                    key={tournament.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -4 }}
                    onClick={() => navigate(`/tournaments/${tournament.id}`)}
                    className="glass-card p-6 cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-white font-semibold text-lg group-hover:text-purple-400 transition-colors">
                          {tournament.name}
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">{tournament.format}</p>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm font-medium">
                        {tournament.status}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-slate-400">
                        <span className="text-white font-semibold">{tournament.max_players}</span> players max
                      </div>
                      <div className="text-green-400 font-semibold">
                        Entry: ${tournament.entry_fee}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlayerDashboard
import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useWallet } from '../../contexts/WalletContext'
import { useGame } from '../../contexts/GameContext'
import PlayerSidebar from './PlayerSidebar'
import DashboardCard from './DashboardCard'
import GameHistoryTable from './GameHistoryTable'

const PlayerDashboard: React.FC = () => {
  const { state: authState } = useAuth()
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
    error: gameError 
  } = useGame()

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
    <div className="min-h-screen bg-slate-900">
      {/* Sidebar */}
      <PlayerSidebar />
      
      {/* Main Content */}
      <div className="ml-18">
        <div className="p-6 space-y-8">
          {/* Header */}
          <header className="flex justify-between items-center">
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
            <div className="flex items-center space-x-4">
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
            </div>
          </header>

          {/* Summary Cards Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Balance Card */}
            <DashboardCard
              title="Balance"
              value={`$${balance.toFixed(2)}`}
              gradient="blue"
              className="h-40"
            />
            
            {/* Recent Payment Card */}
            <DashboardCard
              title="Recent Payment"
              value={`$${recentPayment.toFixed(2)}`}
              gradient="green"
              className="h-40"
            />
          </div>

          {/* Active Games and Tournaments Row */}
          <div className="bg-slate-800 rounded-2xl p-6 shadow-xl">
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
                className="w-full"
              />
            ) : (
              <div className="bg-slate-900 rounded-2xl p-8 text-center">
                <p className="text-slate-400 text-lg">No game history available</p>
                <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Play Your First Game
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
                    className="bg-slate-800 rounded-2xl p-6 shadow-xl hover:bg-slate-750 transition-colors cursor-pointer"
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
  )
}

export default PlayerDashboard
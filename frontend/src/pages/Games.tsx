import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreateGameForm } from '../components/games/CreateGameForm'
import { GameList } from '../components/games/GameList'
import { apiClient } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useWallet } from '../contexts/WalletContext'

const Games: React.FC = () => {
  const { state: authState } = useAuth()
  const { balance } = useWallet()
  const navigate = useNavigate()
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joinLoading, setJoinLoading] = useState(false)

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) {
      setJoinError('Please enter a game code')
      return
    }

    setJoinLoading(true)
    setJoinError(null)

    try {
      // Try to find game by code (game_code is a string like "ABC123")
      // apiClient already returns response.data, so we access directly
      const responseData = await apiClient.get(`/games/${joinCode.trim()}`)
      const game = responseData.game || responseData.data?.game
      
      if (game && game.status === 'waiting') {
        // Join the game
        await apiClient.post(`/games/${game.id}/join`)
        navigate(`/games/play/${game.id}`)
      } else {
        setJoinError('Game not found or already in progress')
      }
    } catch (error: any) {
      setJoinError(error.response?.data?.error || 'Failed to join game')
    } finally {
      setJoinLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Home</span>
            <span>›</span>
            <span className="text-gray-700 font-medium">Games</span>
          </nav>
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Game Lobby</h1>
            <p className="text-gray-600 mt-1">Browse, create, and join games</p>
          </div>

          {/* User Balance Display */}
          {authState.isAuthenticated && (
            <div className="mt-4 md:mt-0 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
              <span className="text-sm text-gray-600">Your Balance: </span>
              <span className="font-bold text-green-600">KES {balance.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Join by Code Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 mb-8 text-white">
          <h2 className="text-xl font-semibold mb-4">🎯 Join Game by Code</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter game code (e.g., ABC123)"
              maxLength={6}
              className="flex-1 px-4 py-2 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 uppercase font-mono"
            />
            <button
              onClick={handleJoinByCode}
              disabled={joinLoading}
              className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {joinLoading ? 'Joining...' : 'Join Game'}
            </button>
          </div>
          {joinError && (
            <p className="text-red-200 text-sm mt-2">{joinError}</p>
          )}
          <p className="text-blue-100 text-sm mt-2">
            💡 Ask your friend for the 6-character game code to join their game
          </p>
        </div>

        {/* Create Game Section */}
        <CreateGameForm />

        {/* Open Games Section */}
        <GameList />

        {/* Quick Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">💡 Quick Tips</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Create games with different stake amounts</li>
            <li>• Join open games to play against others</li>
            <li>• Check game details before joining</li>
            <li>• Your balance is displayed at the top right</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Games
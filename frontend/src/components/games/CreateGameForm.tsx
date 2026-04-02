import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useWallet } from '../../contexts/WalletContext'
import { useGame } from '../../contexts/GameContext'
import { apiClient } from '../../services/api'

const gameTypes = [
  { value: 'draw_1v1', label: '🎯 Draw 1v1', color: 'bg-blue-500' },
  { value: 'pool_8ball', label: '🎱 Pool 8ball', color: 'bg-yellow-500' },
  { value: 'card_blackjack', label: '🃏 Blackjack', color: 'bg-purple-500' },
  { value: 'poker_texas_holdem', label: '♠️ Poker Texas Hold\'em', color: 'bg-red-500' },
]

const aiDifficulties = [
  { value: 'easy', label: '🤖 Easy Bot', description: 'Beginner friendly' },
  { value: 'medium', label: '🤖 Medium Bot', description: 'Balanced challenge' },
  { value: 'hard', label: '🤖 Hard Bot', description: 'Expert level' },
]

export const CreateGameForm: React.FC = () => {
  const { state: authState } = useAuth()
  const { balance } = useWallet()
  const { refreshGameData } = useGame()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedGameType, setSelectedGameType] = useState('draw_1v1')
  const [stakeAmount, setStakeAmount] = useState('100')
  const [isFree, setIsFree] = useState(false)
  const [allowAI, setAllowAI] = useState(false)
  const [aiDifficulty, setAiDifficulty] = useState('medium')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [createdGameId, setCreatedGameId] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!authState.isAuthenticated) {
      setError('Please login to create a game')
      return
    }

    try {
      const amount = parseFloat(stakeAmount)
      if (amount < 0) {
        setError('Stake amount must be non-negative')
        return
      }

      if (!isFree && amount > 0 && amount > balance) {
        setError('Insufficient balance')
        return
      }


      setIsLoading(true)
      try {
        const gameData = {
          game_type: selectedGameType,
          stake_amount: parseFloat(stakeAmount),
          is_free: isFree,
          allow_ai: allowAI,
          ai_difficulty: allowAI ? aiDifficulty : undefined
        }

        // apiClient already returns response.data, so we access directly
        const responseData = await apiClient.post('/games', gameData)
        const game = responseData.game || responseData.data?.game
        
        setSuccess(`Game created successfully! Game code: ${game.game_code}`)
        setCreatedGameId(game.id)
        
        // Refresh game data to include the new game in activeGames
        await refreshGameData()
        
        // Reset form fields but keep success message visible
        setStakeAmount('100')
        setIsFree(false)
        setAllowAI(false)
        setAiDifficulty('medium')
        
        // Scroll to success message after a brief delay to ensure DOM update
        setTimeout(() => {
          const successElement = document.getElementById('success-message')
          if (successElement) {
            successElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 100)
      } catch (error: any) {
        console.error('Error creating game:', error)
        setError(error.response?.data?.error || 'Failed to create game')
      } finally {
        setIsLoading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game')
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Game</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div id="success-message" className="bg-green-50 border-2 border-green-400 text-green-800 px-6 py-4 rounded-lg mb-6 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-bold text-lg">{success}</p>
                <p className="text-sm text-green-600 mt-1">Your game is ready! Click "Play Now" to start.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {createdGameId && (
                <button
                  onClick={() => navigate(`/games/play/${createdGameId}`)}
                  className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-base font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <span className="text-xl">🎮</span>
                  Play Now
                </button>
              )}
              <button
                onClick={() => {
                  const gameCode = success.split('Game code: ')[1] || ''
                  if (gameCode) {
                    navigator.clipboard.writeText(gameCode)
                    alert('Game code copied to clipboard!')
                  }
                }}
                className="bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                📋 Copy Code
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Game Type Selection */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Game Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {gameTypes.map((game) => (
                <button
                  key={game.value}
                  type="button"
                  onClick={() => setSelectedGameType(game.value)}
                  className={`px-4 py-3 rounded-lg text-white font-medium transition-all duration-200 ${selectedGameType === game.value ? game.color : 'bg-gray-200 text-gray-600'} hover:opacity-90`}
                >
                  {game.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stake Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stake Amount (KES)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">KES</span>
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                min="0"
                step="10"
                disabled={isFree}
                placeholder="0 for free game"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Enter 0 to create a free game (no stake required)</p>
          </div>
        </div>

        {/* Free Game Toggle */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="free-game"
            checked={isFree}
            onChange={(e) => {
              setIsFree(e.target.checked)
              if (e.target.checked) {
                setStakeAmount('0')
              }
            }}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="free-game" className="ml-2 block text-sm text-gray-700">
            Create as free game (no stake required)
          </label>
        </div>
        
        {/* 0 Stake Info */}
        {parseFloat(stakeAmount) === 0 && !isFree && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎮</span>
              <div>
                <p className="font-medium">Free Game Mode</p>
                <p className="text-sm">This game will have no stake - perfect for practice or casual play!</p>
              </div>
            </div>
          </div>
        )}

        {/* AI Opponent Toggle */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="ai-opponent"
            checked={allowAI}
            onChange={(e) => setAllowAI(e.target.checked)}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <label htmlFor="ai-opponent" className="ml-2 block text-sm text-gray-700">
            🤖 Play against AI opponent
          </label>
        </div>

        {/* AI Difficulty Selection */}
        {allowAI && (
          <div className="ml-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              AI Difficulty Level
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {aiDifficulties.map((difficulty) => (
                <button
                  key={difficulty.value}
                  type="button"
                  onClick={() => setAiDifficulty(difficulty.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    aiDifficulty === difficulty.value
                      ? 'bg-purple-500 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-purple-50'
                  }`}
                >
                  <div className="font-medium">{difficulty.label}</div>
                  <div className="text-xs opacity-75">{difficulty.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Current Balance */}
        <div className="text-sm text-gray-600">
          Your balance: <span className="font-medium text-green-600">KES {balance.toFixed(2)}</span>
        </div>

        {/* Create Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
              Creating...
            </>
          ) : (
            'Create Game'
          )}
        </button>
      </form>
    </div>
  )
}
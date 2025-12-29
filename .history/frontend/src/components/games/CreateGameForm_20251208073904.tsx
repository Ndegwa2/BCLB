import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useGames } from '../../contexts/GameContext'
import { useWallet } from '../../contexts/WalletContext'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

const gameTypes = [
  { value: 'draw_1v1', label: '🎯 Draw 1v1', color: 'bg-blue-500' },
  { value: 'pool_8ball', label: '🎱 Pool 8ball', color: 'bg-yellow-500' },
  { value: 'card_blackjack', label: '🃏 Blackjack', color: 'bg-purple-500' },
]

export const CreateGameForm: React.FC = () => {
  const { user } = useAuth()
  const { createGame, isLoading } = useGames()
  const { balance } = useWallet()
  const [selectedGameType, setSelectedGameType] = useState('draw_1v1')
  const [stakeAmount, setStakeAmount] = useState('100')
  const [isFree, setIsFree] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!user) {
      setError('Please login to create a game')
      return
    }

    try {
      const amount = parseFloat(stakeAmount)
      if (amount < 0) {
        setError('Stake amount must be positive')
        return
      }

      if (!isFree && amount > balance) {
        setError('Insufficient balance')
        return
      }

      const gameData = {
        game_type: selectedGameType,
        stake_amount: amount,
        is_free: isFree
      }

      const result = await createGame(gameData)
      setSuccess(`Game created successfully! Game code: ${result.game.game_code}`)
      // Reset form
      setStakeAmount('100')
      setIsFree(false)
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
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
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
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              />
            </div>
          </div>
        </div>

        {/* Free Game Toggle */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="free-game"
            checked={isFree}
            onChange={(e) => setIsFree(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="free-game" className="ml-2 block text-sm text-gray-700">
            Create as free game (no stake required)
          </label>
        </div>

        {/* Current Balance */}
        <div className="text-sm text-gray-600">
          Your balance: <span className="font-medium text-green-600">KES {balance.toFixed(2)}</span>
        </div>

        {/* Create Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
        >
          {isLoading ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
              Creating...
            </>
          ) : (
            'Create Game'
          )}
        </Button>
      </form>
    </div>
  )
}
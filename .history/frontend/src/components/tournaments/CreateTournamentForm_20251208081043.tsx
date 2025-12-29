import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useWallet } from '../../contexts/WalletContext'

const gameTypes = [
  { value: 'draw_1v1', label: '🎯 Draw 1v1' },
  { value: 'pool_8ball', label: '🎱 Pool 8ball' },
  { value: 'card_blackjack', label: '🃏 Blackjack' },
]

const formatTypes = [
  { value: 'single_elimination', label: 'Single Elimination' },
  { value: 'double_elimination', label: 'Double Elimination' },
]

export const CreateTournamentForm: React.FC = () => {
  const { state: authState } = useAuth()
  const { balance } = useWallet()
  const [tournamentName, setTournamentName] = useState('')
  const [selectedGameType, setSelectedGameType] = useState('draw_1v1')
  const [entryFee, setEntryFee] = useState('50')
  const [maxPlayers, setMaxPlayers] = useState('16')
  const [selectedFormat, setSelectedFormat] = useState('single_elimination')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!authState.isAuthenticated) {
      setError('Please login to create a tournament')
      return
    }

    if (!authState.user?.is_admin) {
      setError('Only admin users can create tournaments')
      return
    }

    try {
      const fee = parseFloat(entryFee)
      const players = parseInt(maxPlayers)

      if (fee < 0) {
        setError('Entry fee must be positive')
        return
      }

      if (players < 2 || players > 64) {
        setError('Max players must be between 2 and 64')
        return
      }

      const tournamentData = {
        name: tournamentName.trim(),
        game_type: selectedGameType,
        entry_fee: fee,
        max_players: players,
        format: selectedFormat
      }

      setIsLoading(true)

      // TODO: Implement actual tournament creation API call
      // This would call the backend /api/tournaments endpoint
      // For now, simulate success
      await new Promise(resolve => setTimeout(resolve, 1000))

      setSuccess(`Tournament "${tournamentName}" created successfully!`)
      // Reset form
      setTournamentName('')
      setEntryFee('50')
      setMaxPlayers('16')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tournament')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Tournament</h2>
      <p className="text-sm text-gray-600 mb-4">Only available to admin users</p>

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tournament Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tournament Name
            </label>
            <input
              type="text"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              placeholder="e.g., Weekly Poker Championship"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              required
            />
          </div>

          {/* Game Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Game Type
            </label>
            <select
              value={selectedGameType}
              onChange={(e) => setSelectedGameType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            >
              {gameTypes.map((game) => (
                <option key={game.value} value={game.value}>
                  {game.label}
                </option>
              ))}
            </select>
          </div>

          {/* Entry Fee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entry Fee (KES)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">KES</span>
              <input
                type="number"
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
                min="0"
                step="10"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              />
            </div>
          </div>

          {/* Max Players */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Players
            </label>
            <input
              type="number"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(e.target.value)}
              min="2"
              max="64"
              step="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
          </div>

          {/* Format Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tournament Format
            </label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            >
              {formatTypes.map((format) => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </select>
          </div>
        </div>

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
            'Create Tournament'
          )}
        </button>
      </form>
    </div>
  )
}
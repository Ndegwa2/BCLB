import React from 'react'
import { useAuth } from '../../contexts/AuthContext'

interface TournamentCardProps {
  tournament: {
    id: number
    name: string
    game_type: string
    entry_fee: number
    max_players: number
    status: string
    created_at: string
    player_count?: number
  }
  onJoin: (tournamentId: number) => void
  onView: (tournamentId: number) => void
}

export const TournamentCard: React.FC<TournamentCardProps> = ({ tournament, onJoin, onView }) => {
  const { state: authState } = useAuth()

  // Determine game type icon and color
  const getGameTypeInfo = (type: string) => {
    switch (type) {
      case 'draw_1v1':
        return { icon: '🎯', color: 'bg-blue-500', label: 'Draw 1v1' }
      case 'pool_8ball':
        return { icon: '🎱', color: 'bg-yellow-500', label: 'Pool 8ball' }
      case 'card_blackjack':
        return { icon: '🃏', color: 'bg-purple-500', label: 'Blackjack' }
      default:
        return { icon: '🎮', color: 'bg-gray-500', label: type }
    }
  }

  const gameTypeInfo = getGameTypeInfo(tournament.game_type)
  const isFull = (tournament.player_count || 0) >= tournament.max_players

  // Determine status badge
  const getStatusBadge = () => {
    switch (tournament.status) {
      case 'open':
        return { text: 'OPEN', color: 'bg-green-500' }
      case 'in_progress':
        return { text: 'LIVE', color: 'bg-red-500' }
      case 'completed':
        return { text: 'COMPLETED', color: 'bg-gray-500' }
      default:
        return { text: tournament.status.toUpperCase(), color: 'bg-gray-500' }
    }
  }

  const statusBadge = getStatusBadge()

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-4 hover:shadow-md transition-shadow duration-200">
      <div className="grid grid-cols-1 md:grid-cols-8 gap-4 items-center">
        {/* Tournament Name */}
        <div className="md:col-span-2">
          <div className="font-bold text-lg text-gray-900">{tournament.name}</div>
        </div>

        {/* Game Type */}
        <div className="md:col-span-1">
          <div className="flex items-center">
            <span className={`text-xl mr-2 ${gameTypeInfo.color.replace('bg-', 'text-')}`}>
              {gameTypeInfo.icon}
            </span>
            <span className="text-sm text-gray-600">{gameTypeInfo.label}</span>
          </div>
        </div>

        {/* Entry Fee */}
        <div className="md:col-span-1">
          <div className="font-bold text-green-600">KES {tournament.entry_fee.toFixed(2)}</div>
          <div className="text-xs text-gray-500">Entry Fee</div>
        </div>

        {/* Max Players */}
        <div className="md:col-span-1">
          <div className="font-medium">{tournament.max_players} Players Max</div>
          <div className="text-xs text-gray-500">Capacity</div>
        </div>

        {/* Players Joined */}
        <div className="md:col-span-1">
          <div className="font-medium">
            {(tournament.player_count || 0)}/{tournament.max_players}
          </div>
          <div className="text-xs text-gray-500">Joined</div>
        </div>

        {/* Format */}
        <div className="md:col-span-1">
          <div className="text-sm">
            {tournament.status === 'open' ? 'Single Elimination' : 'Double Elimination'}
          </div>
          <div className="text-xs text-gray-500">Format</div>
        </div>

        {/* Created */}
        <div className="md:col-span-1">
          <div className="text-sm text-gray-600">
            {new Date(tournament.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-xs text-gray-500">Created</div>
        </div>

        {/* Status & Actions */}
        <div className="md:col-span-1 flex justify-end items-center space-x-2">
          {/* Status Badge */}
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.color} text-white`}>
            {statusBadge.text}
          </div>

          {/* Action Buttons */}
          {tournament.status === 'open' && !isFull ? (
            <button
              onClick={() => onJoin(tournament.id)}
              className="px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Join
            </button>
          ) : tournament.status === 'open' && isFull ? (
            <button
              disabled
              className="px-3 py-1 bg-gray-300 text-gray-600 text-sm font-medium rounded-md cursor-not-allowed"
            >
              Full
            </button>
          ) : null}

          <button
            onClick={() => onView(tournament.id)}
            className="px-3 py-1 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
          >
            View
          </button>
        </div>
      </div>
    </div>
  )
}
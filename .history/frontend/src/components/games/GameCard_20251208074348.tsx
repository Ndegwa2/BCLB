import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useGame } from '../../contexts/GameContext'

interface GameCardProps {
  game: {
    id: number
    game_code: string
    game_type: string
    stake_amount: number
    total_pot: number
    status: string
    created_at: string
    creator_id: number
    player_count?: number
    max_players?: number
  }
  onJoin: (gameId: number) => void
  onView: (gameId: number) => void
}

export const GameCard: React.FC<GameCardProps> = ({ game, onJoin, onView }) => {
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

  const gameTypeInfo = getGameTypeInfo(game.game_type)
  const isFull = game.player_count >= (game.max_players || 2)
  const isCreator = authState.user?.id === game.creator_id

  // Determine status badge
  const getStatusBadge = () => {
    switch (game.status) {
      case 'waiting':
        return { text: 'Waiting', color: 'bg-green-100 text-green-800' }
      case 'in_progress':
        return { text: 'In Progress', color: 'bg-blue-100 text-blue-800' }
      case 'completed':
        return { text: 'Completed', color: 'bg-gray-100 text-gray-800' }
      case 'cancelled':
        return { text: 'Cancelled', color: 'bg-red-100 text-red-800' }
      default:
        return { text: game.status, color: 'bg-gray-100 text-gray-800' }
    }
  }

  const statusBadge = getStatusBadge()

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-4 hover:shadow-md transition-shadow duration-200">
      <div className="grid grid-cols-1 md:grid-cols-8 gap-4 items-center">
        {/* Game Code */}
        <div className="md:col-span-1">
          <div className="font-mono text-sm text-gray-500">Code</div>
          <div className="font-bold text-blue-600">{game.game_code}</div>
        </div>

        {/* Game Type */}
        <div className="md:col-span-1">
          <div className="font-mono text-sm text-gray-500">Type</div>
          <div className="flex items-center">
            <span className={`text-xl mr-2 ${gameTypeInfo.color.replace('bg-', 'text-')}`}>
              {gameTypeInfo.icon}
            </span>
            <span className="font-medium">{gameTypeInfo.label}</span>
          </div>
        </div>

        {/* Stake */}
        <div className="md:col-span-1">
          <div className="font-mono text-sm text-gray-500">Stake</div>
          <div className="font-bold text-green-600">KES {game.stake_amount.toFixed(2)}</div>
        </div>

        {/* Players */}
        <div className="md:col-span-1">
          <div className="font-mono text-sm text-gray-500">Players</div>
          <div className="font-medium">
            {game.player_count || 1}/{(game.max_players || 2)}
          </div>
        </div>

        {/* Creator */}
        <div className="md:col-span-1">
          <div className="font-mono text-sm text-gray-500">Creator</div>
          <div className="text-sm text-gray-700 truncate">
            {isCreator ? 'You' : `Player ${game.creator_id}`}
          </div>
        </div>

        {/* Created */}
        <div className="md:col-span-1">
          <div className="font-mono text-sm text-gray-500">Created</div>
          <div className="text-sm text-gray-600">
            {new Date(game.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Status */}
        <div className="md:col-span-1">
          <div className="font-mono text-sm text-gray-500">Status</div>
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}>
            {statusBadge.text}
          </div>
        </div>

        {/* Actions */}
        <div className="md:col-span-1 flex justify-end space-x-2">
          {game.status === 'waiting' && !isFull && !isCreator ? (
            <button
              onClick={() => onJoin(game.id)}
              className="px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Join
            </button>
          ) : game.status === 'waiting' && isFull ? (
            <button
              disabled
              className="px-3 py-1 bg-gray-300 text-gray-600 text-sm font-medium rounded-md cursor-not-allowed"
            >
              Full
            </button>
          ) : null}

          <button
            onClick={() => onView(game.id)}
            className="px-3 py-1 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
          >
            View
          </button>
        </div>
      </div>
    </div>
  )
}
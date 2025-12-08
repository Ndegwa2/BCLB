import React from 'react'
import { useNavigate } from 'react-router-dom'

interface GameHistoryItem {
  id: string
  game: string
  date: string
  result: 'win' | 'loss'
  icon?: string
}

interface GameHistoryTableProps {
  games: GameHistoryItem[]
  className?: string
}

const GameHistoryTable: React.FC<GameHistoryTableProps> = ({ games, className = '' }) => {
  const navigate = useNavigate()

  const getGameIcon = (game: string) => {
    switch (game.toLowerCase()) {
      case 'poker':
        return (
          <div className="w-10 h-10 bg-purple-400 rounded-full flex items-center justify-center">
            <div className="text-white text-sm">P</div>
          </div>
        )
      case 'chess':
        return (
          <div className="w-10 h-10 bg-emerald-400 rounded-lg flex items-center justify-center">
            <div className="text-white text-sm">♔</div>
          </div>
        )
      case 'trivia':
        return (
          <div className="w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center">
            <div className="text-white text-sm">?</div>
          </div>
        )
      default:
        return (
          <div className="w-10 h-10 bg-slate-500 rounded-full flex items-center justify-center">
            <div className="text-white text-sm">{game.charAt(0)}</div>
          </div>
        )
    }
  }

  return (
    <div className={`bg-slate-900 rounded-2xl shadow-xl ${className}`}>
      {/* Table Header */}
      <div className="bg-slate-800 rounded-t-2xl p-4">
        <div className="grid grid-cols-3 gap-4 text-slate-400 text-base font-semibold">
          <div>Game</div>
          <div className="text-center">Date</div>
          <div className="text-right">Result</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-slate-700">
        {games.map((game, index) => (
          <div
            key={game.id}
            className={`grid grid-cols-3 gap-4 p-6 hover:bg-slate-800 cursor-pointer transition-colors ${
              index % 2 === 1 ? 'bg-slate-800' : 'bg-slate-900'
            }`}
            onClick={() => navigate('/games')}
          >
            <div className="flex items-center space-x-4">
              {getGameIcon(game.game)}
              <span className="text-slate-200 text-lg">{game.game}</span>
            </div>
            <div className="flex items-center justify-center text-slate-200 text-lg">
              {game.date}
            </div>
            <div className="flex items-center justify-end">
              <span 
                className={`font-bold text-lg ${
                  game.result === 'win' ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {game.result === 'win' ? 'Win' : 'Loss'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default GameHistoryTable
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Trophy, 
  Swords, 
  Brain, 
  Dices, 
  ChevronRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

interface GameHistoryItem {
  id: string
  game: string
  date: string
  result: 'win' | 'loss'
  stake?: number
  payout?: number
}

interface GameHistoryTableProps {
  games: GameHistoryItem[]
  className?: string
}

const gameIcons: Record<string, React.ElementType> = {
  'poker': Dices,
  'chess': Brain,
  'blackjack': Swords,
  'pool': Trophy,
  'darts': Trophy,
}

const getGameIcon = (game: string) => {
  const gameLower = game.toLowerCase()
  const Icon = gameIcons[gameLower] || Trophy
  
  const gradientClasses: Record<string, string> = {
    'poker': 'from-purple-500 to-pink-500',
    'chess': 'from-emerald-500 to-green-500',
    'blackjack': 'from-blue-500 to-cyan-500',
    'pool': 'from-amber-500 to-orange-500',
    'darts': 'from-red-500 to-rose-500',
  }
  
  return (
    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradientClasses[gameLower] || 'from-slate-500 to-slate-600'} flex items-center justify-center shadow-lg`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
  )
}

const GameHistoryTable: React.FC<GameHistoryTableProps> = ({ games, className = '' }) => {
  const navigate = useNavigate()

  if (games.length === 0) {
    return (
      <div className={`glass-card p-8 text-center ${className}`}>
        <Trophy className="w-12 h-12 text-slate-500 mx-auto mb-4" />
        <p className="text-slate-400 text-lg">No game history yet</p>
        <p className="text-slate-500 text-sm mt-2">Play your first game to see it here!</p>
      </div>
    )
  }

  return (
    <div className={`glass-card overflow-hidden ${className}`}>
      {/* Table Header */}
      <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-700">
        <div className="grid grid-cols-4 gap-4 text-slate-400 text-sm font-medium">
          <div>Game</div>
          <div>Date</div>
          <div className="text-right">Result</div>
          <div className="text-right">Payout</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-slate-700/50">
        {games.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="grid grid-cols-4 gap-4 px-6 py-4 hover:bg-slate-800/30 cursor-pointer transition-colors"
            onClick={() => navigate('/games')}
          >
            <div className="flex items-center gap-3">
              {getGameIcon(game.game)}
              <span className="text-white font-medium">{game.game}</span>
            </div>
            <div className="flex items-center text-slate-400">
              {game.date}
            </div>
            <div className="flex items-center justify-end">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                game.result === 'win' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {game.result === 'win' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {game.result === 'win' ? 'Win' : 'Loss'}
              </span>
            </div>
            <div className="flex items-center justify-end">
              {game.payout !== undefined && (
                <span className={`font-semibold ${
                  game.result === 'win' ? 'text-green-400' : 'text-slate-500'
                }`}>
                  {game.result === 'win' ? '+' : '-'}${Math.abs(game.payout).toFixed(2)}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-slate-600 ml-2" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default GameHistoryTable
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../services/api'
import { toast } from 'sonner'

interface GameOption {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  stakeOptions: number[]
}

const PlayVsAI: React.FC = () => {
  const navigate = useNavigate()
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('medium')
  const [selectedStake, setSelectedStake] = useState<number>(0)
  const [creating, setCreating] = useState(false)

  const gameOptions: GameOption[] = [
    {
      id: 'draw_1v1',
      name: 'Draw Game',
      description: 'Classic draw game - highest number wins!',
      icon: (
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      stakeOptions: [0, 10, 25, 50, 100]
    },
    {
      id: 'pool_8ball',
      name: '8-Ball Pool',
      description: 'Strategic pool game - pocket all your balls first!',
      icon: (
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="10" strokeWidth={2} />
          <circle cx="12" cy="12" r="4" fill="currentColor" />
        </svg>
      ),
      stakeOptions: [0, 25, 50, 100, 200]
    },
    {
      id: 'card_blackjack',
      name: 'Blackjack',
      description: 'Beat the dealer - get as close to 21 as possible!',
      icon: (
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      stakeOptions: [0, 10, 25, 50, 100]
    }
  ]

  const difficultyOptions = [
    { id: 'easy', name: 'Easy', description: 'Perfect for beginners', color: 'bg-green-500' },
    { id: 'medium', name: 'Medium', description: 'Balanced challenge', color: 'bg-yellow-500' },
    { id: 'hard', name: 'Hard', description: 'For experienced players', color: 'bg-orange-500' },
    { id: 'expert', name: 'Expert', description: 'Ultimate challenge', color: 'bg-red-500' }
  ]

  const handleCreateGame = async () => {
    if (!selectedGame) {
      toast.error('Please select a game type')
      return
    }

    try {
      setCreating(true)
      
      const response = await apiClient.post('/games', {
        game_type: selectedGame,
        stake_amount: selectedStake,
        is_free: selectedStake === 0,
        allow_ai: true,
        ai_difficulty: selectedDifficulty
      })

      const newGame = response.data.game
      
      toast.success('Game created! Starting...')
      
      // Navigate to the game
      navigate(`/games/play/${newGame.id}`)
      
    } catch (error: any) {
      console.error('Error creating AI game:', error)
      toast.error(error.response?.data?.error || 'Failed to create game')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Play vs AI</h1>
          <p className="text-slate-400">Challenge our intelligent AI opponents and test your skills!</p>
        </div>

        {/* Game Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Select Game</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {gameOptions.map((game) => (
              <button
                key={game.id}
                onClick={() => setSelectedGame(game.id)}
                className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                  selectedGame === game.id
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className={`mb-4 ${selectedGame === game.id ? 'text-blue-400' : 'text-slate-400'}`}>
                  {game.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{game.name}</h3>
                <p className="text-slate-400 text-sm">{game.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Select Difficulty</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {difficultyOptions.map((difficulty) => (
              <button
                key={difficulty.id}
                onClick={() => setSelectedDifficulty(difficulty.id)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedDifficulty === difficulty.id
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${difficulty.color} mb-3`}></div>
                <h3 className="text-lg font-semibold text-white mb-1">{difficulty.name}</h3>
                <p className="text-slate-400 text-xs">{difficulty.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Stake Selection */}
        {selectedGame && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Select Stake</h2>
            <div className="flex flex-wrap gap-3">
              {gameOptions
                .find((g) => g.id === selectedGame)
                ?.stakeOptions.map((stake) => (
                  <button
                    key={stake}
                    onClick={() => setSelectedStake(stake)}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                      selectedStake === stake
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {stake === 0 ? 'Free Play' : `$${stake}`}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Start Game Button */}
        <div className="mt-8">
          <button
            onClick={handleCreateGame}
            disabled={!selectedGame || creating}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 ${
              !selectedGame || creating
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {creating ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Game...
              </span>
            ) : (
              `Start Game${selectedStake > 0 ? ` - $${selectedStake}` : ' (Free)'}`
            )}
          </button>
        </div>

        {/* AI Info Section */}
        <div className="mt-12 p-6 bg-slate-800 rounded-xl">
          <h2 className="text-2xl font-semibold text-white mb-4">About Our AI</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">🧠 Intelligent Decision Making</h3>
              <p className="text-slate-400">
                Our AI uses advanced algorithms to make strategic decisions based on game state and difficulty level.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">📈 Adaptive Learning</h3>
              <p className="text-slate-400">
                The AI adapts to your playing style and learns from previous moves to provide a challenging experience.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">⚡ Multiple Personalities</h3>
              <p className="text-slate-400">
                Choose from different AI personalities - aggressive, defensive, or balanced - for varied gameplay.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">🎯 Fair Play</h3>
              <p className="text-slate-400">
                Each difficulty level has calibrated win probabilities to ensure fair and enjoyable matches.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlayVsAI
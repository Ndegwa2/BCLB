import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { apiClient } from '../services/api'
import { useAuth } from './AuthContext'

interface Game {
  id: number
  game_code: string
  game_type: string
  status: string
  stake_amount: number
  total_pot: number
  created_at: string
  my_entry?: {
    id: number
    result: 'win' | 'loss'
    stake_amount: number
    joined_at: string
  }
}

interface GameContextType {
  gameHistory: Game[]
  activeGames: Game[]
  upcomingTournaments: any[]
  loading: boolean
  error: string | null
  refreshGameData: () => Promise<void>
  getGameHistory: () => Promise<void>
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { state: authState } = useAuth()
  const [gameHistory, setGameHistory] = useState<Game[]>([])
  const [activeGames, setActiveGames] = useState<Game[]>([])
  const [upcomingTournaments, setUpcomingTournaments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getGameHistory = async () => {
    if (!authState.isAuthenticated) return
    
    try {
      const response = await apiClient.get('/games/mine?limit=10')
      const data = response.data
      
      // Filter for completed games (game history)
      const completed = data.games?.filter((game: Game) => game.status === 'completed') || []
      setGameHistory(completed)
      
      // Filter for active games (in_progress, waiting)
      const active = data.games?.filter((game: Game) =>
        ['in_progress', 'waiting'].includes(game.status)
      ) || []
      setActiveGames(active)
      
    } catch (err: any) {
      console.error('Game history fetch error:', err)
    }
  }

  const getUpcomingTournaments = async () => {
    if (!authState.isAuthenticated) return
    
    try {
      // Get upcoming tournaments - this would need to be implemented
      // For now, returning mock data
      setUpcomingTournaments([
        {
          id: 1,
          name: 'Weekly Poker Championship',
          date: '2025-11-30',
          prize: '$100'
        },
        {
          id: 2,
          name: 'Chess Masters Tournament',
          date: '2025-12-05',
          prize: '$75'
        }
      ])
    } catch (err: any) {
      console.error('Tournaments fetch error:', err)
    }
  }

  const refreshGameData = async () => {
    if (!authState.isAuthenticated) return
    
    try {
      setLoading(true)
      setError(null)
      
      await Promise.all([
        getGameHistory(),
        getUpcomingTournaments()
      ])
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch game data')
      console.error('Game data fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authState.isAuthenticated) {
      refreshGameData()
    }
  }, [authState.isAuthenticated])

  const value = {
    gameHistory,
    activeGames,
    upcomingTournaments,
    loading,
    error,
    refreshGameData,
    getGameHistory
  }

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { apiClient } from '../services/api'
import { useAuth } from './AuthContext'
import { GameEntry } from '../types/game'

interface Game {
  id: number
  game_code: string
  game_type: string
  status: string
  stake_amount: number
  total_pot: number
  created_at: string
  creator_id: number
  allow_ai?: boolean
  ai_opponent_id?: number
  opponent_type?: 'human' | 'ai'
  ai_difficulty?: 'easy' | 'medium' | 'hard'
  my_entry?: {
    id: number
    result: 'win' | 'loss'
    stake_amount: number
    joined_at: string
  }
  entries?: GameEntry[]
}

interface Tournament {
  id: number
  name: string
  game_type: string
  entry_fee: number
  max_players: number
  status: string
  format: string
  created_at: string
  updated_at: string
}

interface GameContextType {
  gameHistory: Game[]
  activeGames: Game[]
  upcomingTournaments: Tournament[]
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
  const [upcomingTournaments, setUpcomingTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getGameHistory = async () => {
    if (!authState.isAuthenticated) return
    
    try {
      const response = await apiClient.get('/games/mine?limit=10')
      // Handle different response structures
      const games = response?.games || response?.data?.games || []
      
      // Filter for completed games (game history)
      const completed = games.filter((game: Game) => game.status === 'completed')
      setGameHistory(completed)
      
      // Filter for active games (in_progress, waiting)
      const active = games.filter((game: Game) =>
        ['in_progress', 'waiting'].includes(game.status)
      )
      setActiveGames(active)
      
    } catch (err: any) {
      console.error('Game history fetch error:', err)
    }
  }

  const getUpcomingTournaments = async () => {
    if (!authState.isAuthenticated) return
    
    try {
      // Fetch upcoming open tournaments from API
      const response = await apiClient.get('/tournaments/open', { params: { limit: 10 } })
      const tournaments = response?.tournaments || response?.data?.tournaments || []
      // Filter for open tournaments only and limit to 5
      const openTournaments = tournaments.filter((t: Tournament) => t.status === 'open').slice(0, 5)
      setUpcomingTournaments(openTournaments)
    } catch (err: any) {
      console.error('Tournaments fetch error:', err)
      // Set empty array on error - no mock data
      setUpcomingTournaments([])
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
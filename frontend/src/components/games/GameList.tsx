import React, { useState, useEffect } from 'react'
import { GameCard } from './GameCard'
import { LoadingSpinner } from '../ui/LoadingSpinner'

interface Game {
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

export const GameList: React.FC = () => {
  const [games, setGames] = useState<Game[]>([])
  const [filteredGames, setFilteredGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'draw_1v1' | 'pool_8ball' | 'card_blackjack'>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Mock data for development - replace with actual API calls
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true)
        setError(null)

        // TODO: Replace with actual API call to /api/games/open
        // const response = await apiClient.get('/games/open', {
        //   params: { page, limit, game_type: filter === 'all' ? undefined : filter }
        // })
        // setGames(response.data.games)
        // setTotalPages(response.data.pagination.pages)

        // Mock data
        const mockGames: Game[] = [
          {
            id: 1,
            game_code: 'ABC123',
            game_type: 'draw_1v1',
            stake_amount: 100,
            total_pot: 100,
            status: 'waiting',
            created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            creator_id: 1,
            player_count: 1,
            max_players: 2
          },
          {
            id: 2,
            game_code: 'DEF456',
            game_type: 'pool_8ball',
            stake_amount: 200,
            total_pot: 200,
            status: 'waiting',
            created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            creator_id: 2,
            player_count: 2,
            max_players: 2
          },
          {
            id: 3,
            game_code: 'GHI789',
            game_type: 'card_blackjack',
            stake_amount: 150,
            total_pot: 150,
            status: 'waiting',
            created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            creator_id: 3,
            player_count: 1,
            max_players: 2
          },
          {
            id: 4,
            game_code: 'JKL012',
            game_type: 'draw_1v1',
            stake_amount: 50,
            total_pot: 50,
            status: 'waiting',
            created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            creator_id: 4,
            player_count: 1,
            max_players: 2
          }
        ]

        setGames(mockGames)
        setTotalPages(1)

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch games')
      } finally {
        setLoading(false)
      }
    }

    fetchGames()
  }, [page, filter])

  // Apply filtering
  useEffect(() => {
    if (filter === 'all') {
      setFilteredGames(games)
    } else {
      setFilteredGames(games.filter(game => game.game_type === filter))
    }
  }, [games, filter])

  const handleJoin = (gameId: number) => {
    // TODO: Implement game joining functionality
    console.log('Joining game:', gameId)
    // This would call /api/games/{gameId}/join endpoint
  }

  const handleView = (gameId: number) => {
    // TODO: Implement game viewing functionality
    console.log('Viewing game:', gameId)
    // This would navigate to game details page
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  const gameTypeFilters = [
    { value: 'all', label: 'All Games' },
    { value: 'draw_1v1', label: 'Draw 1v1' },
    { value: 'pool_8ball', label: 'Pool 8ball' },
    { value: 'card_blackjack', label: 'Blackjack' }
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Open Games</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {gameTypeFilters.map((gameType) => (
          <button
            key={gameType.value}
            onClick={() => setFilter(gameType.value as any)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
              filter === gameType.value
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {gameType.label}
          </button>
        ))}
      </div>

      {/* Game List Header */}
      <div className="hidden md:grid grid-cols-8 gap-4 items-center text-xs font-medium text-gray-500 mb-4 pb-2 border-b border-gray-200">
        <div className="col-span-1">Game Code</div>
        <div className="col-span-1">Type</div>
        <div className="col-span-1">Stake</div>
        <div className="col-span-1">Players</div>
        <div className="col-span-1">Creator</div>
        <div className="col-span-1">Created</div>
        <div className="col-span-1">Status</div>
        <div className="col-span-1 text-right">Action</div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No games found. Create a new game to get started!
        </div>
      ) : (
        <>
          {/* Game List */}
          <div className="space-y-4">
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onJoin={handleJoin}
                onView={handleView}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-8 space-x-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                      page === pageNum
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
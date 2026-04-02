import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TournamentCard } from './TournamentCard'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { Tournament } from '../../types/tournament'
import { apiClient } from '../../services/api'

export const TournamentList: React.FC = () => {
  const navigate = useNavigate()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'draw_1v1' | 'pool_8ball' | 'card_blackjack'>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Fetch open tournaments from API
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true)
        setError(null)

        const params: Record<string, any> = { page, limit: 10 }
        if (filter !== 'all') {
          params.game_type = filter
        }

        const response = await apiClient.get('/tournaments/open', { params })
        setTournaments(response.tournaments || [])
        setTotalPages(response.pagination?.pages || 1)

      } catch (err: any) {
        setError(err.response?.data?.error || err.message || 'Failed to fetch tournaments')
      } finally {
        setLoading(false)
      }
    }

    fetchTournaments()
  }, [page, filter])

  // Apply filtering
  useEffect(() => {
    if (filter === 'all') {
      setFilteredTournaments(tournaments)
    } else {
      setFilteredTournaments(tournaments.filter(tournament => tournament.game_type === filter))
    }
  }, [tournaments, filter])

  const handleJoin = (tournamentId: number) => {
    // TODO: Implement tournament joining functionality
    console.log('Joining tournament:', tournamentId)
    // This would call /api/tournaments/{tournamentId}/join endpoint
  }

  const handleView = (tournamentId: number) => {
    navigate(`/tournaments/${tournamentId}`)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  const gameTypeFilters = [
    { value: 'all', label: 'All Tournaments' },
    { value: 'draw_1v1', label: 'Draw 1v1' },
    { value: 'pool_8ball', label: 'Pool 8ball' },
    { value: 'card_blackjack', label: 'Blackjack' }
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Open Tournaments</h2>

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

      {/* Tournament List Header */}
      <div className="hidden md:grid grid-cols-8 gap-4 items-center text-xs font-medium text-gray-500 mb-4 pb-2 border-b border-gray-200">
        <div className="col-span-2">Tournament Name</div>
        <div className="col-span-1">Game Type</div>
        <div className="col-span-1">Entry Fee</div>
        <div className="col-span-1">Max Players</div>
        <div className="col-span-1">Joined</div>
        <div className="col-span-1">Format</div>
        <div className="col-span-1">Created</div>
        <div className="col-span-1 text-right">Action</div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredTournaments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No tournaments found. Check back later or create a new tournament!
        </div>
      ) : (
        <>
          {/* Tournament List */}
          <div className="space-y-4">
            {filteredTournaments.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
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
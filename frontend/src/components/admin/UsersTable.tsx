import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Shield, 
  User, 
  DollarSign, 
  Gamepad2, 
  Trophy,
  Ban,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react'
import { usersService } from '../../services/users'
import { toast } from 'sonner'

interface UserData {
  id: number
  username: string
  email: string
  phone_number: string
  is_admin: boolean
  created_at: string
  balance: number
  stats: {
    games_played: number
    tournaments_joined: number
  }
}

const UsersTable: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    pages: 0
  })
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async (page: number = 1, limit: number = 10, searchTerm?: string) => {
    setLoading(true)
    setError('')
    try {
      const response = await usersService.getUsers(page, limit, searchTerm)
      setUsers(response.users)
      setPagination(response.pagination)
    } catch (err) {
      setError('Failed to fetch users')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    fetchUsers(page, pagination.per_page, search)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchUsers(1, pagination.per_page, search)
  }

  const handleSuspendUser = async (userId: number, username: string) => {
    if (window.confirm(`Are you sure you want to suspend ${username}?`)) {
      try {
        await usersService.suspendUser(userId)
        toast.success(`User ${username} has been suspended`)
        fetchUsers(pagination.page, pagination.per_page, search)
      } catch (err) {
        toast.error('Failed to suspend user')
      }
    }
  }

  const handleRefresh = () => {
    fetchUsers(pagination.page, pagination.per_page, search)
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-purple-400" />
              User Management
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {pagination.total} total users
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search users by username or email..."
              value={search}
              onChange={handleSearch}
              className="w-full pl-10 pr-24 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && users.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="p-12 text-center">
          <User className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No users found</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Balance</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Games</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Tournaments</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {users.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          user.is_admin 
                            ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                            : 'bg-gradient-to-br from-slate-600 to-slate-700'
                        }`}>
                          {user.is_admin ? (
                            <Shield className="w-5 h-5 text-white" />
                          ) : (
                            <User className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.username}</p>
                          <p className="text-slate-400 text-sm">{user.email || user.phone_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-green-400">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-medium">${user.balance.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Gamepad2 className="w-4 h-4" />
                        <span>{user.stats.games_played}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Trophy className="w-4 h-4" />
                        <span>{user.stats.tournaments_joined}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.is_admin 
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                          : 'bg-slate-700/50 text-slate-300'
                      }`}>
                        {user.is_admin ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {user.is_admin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!user.is_admin && (
                        <button
                          onClick={() => handleSuspendUser(user.id, user.username)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
                        >
                          <Ban className="w-4 h-4" />
                          Suspend
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden p-4 space-y-3">
            {users.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      user.is_admin 
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                        : 'bg-gradient-to-br from-slate-600 to-slate-700'
                    }`}>
                      {user.is_admin ? <Shield className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-slate-300" />}
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.username}</p>
                      <p className="text-slate-400 text-sm">{user.email || user.phone_number}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    user.is_admin 
                      ? 'bg-purple-500/20 text-purple-400' 
                      : 'bg-slate-700/50 text-slate-300'
                  }`}>
                    {user.is_admin ? 'Admin' : 'User'}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Balance</p>
                    <p className="text-green-400 font-medium">${user.balance.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Games</p>
                    <p className="text-white font-medium">{user.stats.games_played}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Tournaments</p>
                    <p className="text-white font-medium">{user.stats.tournaments_joined}</p>
                  </div>
                </div>

                {!user.is_admin && (
                  <button
                    onClick={() => handleSuspendUser(user.id, user.username)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
                  >
                    <Ban className="w-4 h-4" />
                    Suspend User
                  </button>
                )}
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-slate-700/50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  Page {pagination.page} of {pagination.pages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum: number
                    if (pagination.pages <= 5) {
                      pageNum = i + 1
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i
                    } else {
                      pageNum = pagination.page - 2 + i
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                          pagination.page === pageNum
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default UsersTable
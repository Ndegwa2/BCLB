import React, { useState, useEffect } from 'react'
import { usersService } from '../../services/users'

interface User {
  id: number
  username: string
  email: string
  is_admin: boolean
  created_at: string
  balance: number
  stats: {
    games_played: number
    tournaments_joined: number
  }
}

interface UsersTableProps {}

const UsersTable: React.FC<UsersTableProps> = () => {
  const [users, setUsers] = useState<User[]>([])
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

  const fetchUsers = async (page: number = 1, limit: number = 10) => {
    setLoading(true)
    setError('')
    try {
      const response = await usersService.getUsers(page, limit, search)
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
    fetchUsers(page)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchUsers(1)
  }

  const handleSuspendUser = async (userId: number) => {
    if (window.confirm('Are you sure you want to suspend this user?')) {
      try {
        await usersService.suspendUser(userId)
        fetchUsers(pagination.page)
      } catch (err) {
        setError('Failed to suspend user')
      }
    }
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm">
      <div className="p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Users</h2>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mb-6">
          <div className="flex">
            <input
              type="text"
              placeholder="Search users by username or email..."
              value={search}
              onChange={handleSearch}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </form>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-500">Loading users...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Users Table */}
        {!loading && users.length === 0 && !error && (
          <div className="text-center py-8 text-gray-500">
            <p>No users found</p>
          </div>
        )}

        {!loading && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left">Username</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Balance</th>
                  <th className="px-4 py-3 text-left">Games Played</th>
                  <th className="px-4 py-3 text-left">Tournaments Joined</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">{user.username}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">${user.balance.toFixed(2)}</td>
                    <td className="px-4 py-3">{user.stats.games_played}</td>
                    <td className="px-4 py-3">{user.stats.tournaments_joined}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded ${user.is_admin ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {user.is_admin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleSuspendUser(user.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Suspend
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div className="mt-6 flex justify-center">
            <div className="flex items-center">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 bg-gray-200 rounded-l hover:bg-gray-300 disabled:opacity-50"
              >
                Previous
              </button>
              {[...Array(pagination.pages).keys()].map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page + 1)}
                  className={`px-3 py-1 ${pagination.page === page + 1 ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'} hover:bg-blue-50`}
                >
                  {page + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 bg-gray-200 rounded-r hover:bg-gray-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UsersTable
import { apiClient } from './api'

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

interface GetUsersResponse {
  users: User[]
  pagination: {
    page: number
    per_page: number
    total: number
    pages: number
  }
}

export const usersService = {
  async getUsers(page: number = 1, limit: number = 10, search?: string) {
    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', limit.toString())
      if (search) {
        params.append('search', search)
      }

      const response = await apiClient.get(`/admin/users?${params.toString()}`)
      return response.data as GetUsersResponse
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  },

  async suspendUser(userId: number) {
    try {
      const response = await apiClient.post(`/admin/users/${userId}/suspend`)
      return response.data
    } catch (error) {
      console.error('Error suspending user:', error)
      throw error
    }
  }
}
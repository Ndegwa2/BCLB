import { apiClient } from './api'
import { AuthResponse, LoginCredentials, RegisterCredentials } from '../types/auth'

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', credentials)
    return response
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', credentials)
    return response
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },

  verifyToken: async (token: string): Promise<{ user: any }> => {
    const response = await apiClient.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
    return { user: response.user }
  },

  getCurrentUser: async (): Promise<any> => {
    const response = await apiClient.get('/auth/me')
    return response.user
  },
}
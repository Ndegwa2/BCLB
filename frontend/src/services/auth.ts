import { apiClient } from './api'
import { AuthResponse, LoginCredentials, RegisterCredentials } from '../types/auth'

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', credentials)
    return response.data
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', credentials)
    return response.data
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },

  verifyToken: async (token: string): Promise<AuthResponse> => {
    const response = await apiClient.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  getCurrentUser: async (): Promise<any> => {
    const response = await apiClient.get('/auth/me')
    return response.data.user
  },
}
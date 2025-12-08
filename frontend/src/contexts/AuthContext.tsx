import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { AuthState, LoginCredentials, RegisterCredentials, AuthResponse } from '../types/auth'
import { authAPI } from '../services/auth'
import { authStorage } from '../utils/storage'

interface AuthContextType {
  state: AuthState
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: AuthResponse }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_TOKEN'; payload: string }

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      }
    case 'LOGOUT':
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }
    case 'REFRESH_TOKEN':
      return { ...state, token: action.payload }
    default:
      return state
  }
}

const initialState: AuthState = {
  user: null,
  token: authStorage.getToken(),
  isAuthenticated: false,
  isLoading: true,
  error: null,
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'LOGIN_START' })
      const response = await authAPI.login(credentials)
      authStorage.setToken(response.token)
      dispatch({ type: 'LOGIN_SUCCESS', payload: response })
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed. Please try again.'
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage })
    }
  }

  const register = async (credentials: RegisterCredentials) => {
    try {
      dispatch({ type: 'LOGIN_START' })
      const response = await authAPI.register(credentials)
      authStorage.setToken(response.token)
      dispatch({ type: 'LOGIN_SUCCESS', payload: response })
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Registration failed. Please try again.'
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage })
    }
  }

  const logout = () => {
    authStorage.removeToken()
    dispatch({ type: 'LOGOUT' })
  }

  const refreshToken = async () => {
    try {
      const token = authStorage.getToken()
      if (token) {
        const response = await authAPI.verifyToken(token)
        // Keep the existing token since the backend doesn't return a new one for /auth/me
        authStorage.setToken(token)
        dispatch({ type: 'LOGIN_SUCCESS', payload: { token, user: response.user } })
      }
    } catch (error) {
      logout()
    }
  }

  // Auto-login on app start if token exists
  useEffect(() => {
    const initializeAuth = async () => {
      const token = authStorage.getToken()
      if (token) {
        try {
          const user = await authAPI.getCurrentUser()
          dispatch({ 
            type: 'LOGIN_SUCCESS', 
            payload: { token, user } 
          })
        } catch (error) {
          authStorage.removeToken()
          dispatch({ type: 'LOGOUT' })
        }
      } else {
        dispatch({ type: 'LOGOUT' })
      }
    }

    initializeAuth()
  }, [])

  const value = { state, login, register, logout, refreshToken }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
// Local storage utilities with error handling
export const storage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined') return null
      return window.localStorage.getItem(key)
    } catch (error) {
      console.error(`Error getting item from localStorage:`, error)
      return null
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      if (typeof window === 'undefined') return
      window.localStorage.setItem(key, value)
    } catch (error) {
      console.error(`Error setting item in localStorage:`, error)
    }
  },

  removeItem: (key: string): void => {
    try {
      if (typeof window === 'undefined') return
      window.localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing item from localStorage:`, error)
    }
  },

  clear: (): void => {
    try {
      if (typeof window === 'undefined') return
      window.localStorage.clear()
    } catch (error) {
      console.error(`Error clearing localStorage:`, error)
    }
  },
}

// Auth token utilities
export const authStorage = {
  getToken: (): string | null => {
    return storage.getItem('auth_token')
  },

  setToken: (token: string): void => {
    storage.setItem('auth_token', token)
  },

  removeToken: (): void => {
    storage.removeItem('auth_token')
  },

  isAuthenticated: (): boolean => {
    return !!authStorage.getToken()
  },
}
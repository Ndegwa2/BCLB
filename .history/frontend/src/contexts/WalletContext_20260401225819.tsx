import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import { apiClient } from '../services/api'
import { useAuth } from './AuthContext'

interface WalletTransaction {
  id: number
  amount: number
  direction: 'credit' | 'debit'
  tx_type: string
  status: string
  description: string
  created_at: string
}

interface WalletContextType {
  balance: number
  lockedBalance: number
  availableBalance: number
  recentPayment: number
  transactions: WalletTransaction[]
  loading: boolean
  error: string | null
  refreshWallet: (force?: boolean) => Promise<void>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

// Minimum time between refreshes (debounce)
const MIN_REFRESH_INTERVAL = 5000 // 5 seconds

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { state: authState } = useAuth()
  const [balance, setBalance] = useState(0)
  const [lockedBalance, setLockedBalance] = useState(0)
  const [availableBalance, setAvailableBalance] = useState(0)
  const [recentPayment, setRecentPayment] = useState(0)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastRefreshTime = useRef<number>(0)

  const refreshWallet = useCallback(async (force: boolean = false) => {
    if (!authState.isAuthenticated) return
    
    // Debounce: skip if recently refreshed (unless forced)
    const now = Date.now()
    if (!force && now - lastRefreshTime.current < MIN_REFRESH_INTERVAL) {
      console.log('[Wallet] Skipping refresh - too soon')
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      lastRefreshTime.current = now
      
      // Use cached fetch - will return cached data if available
      const data = await apiClient.get('/wallet', {
        params: { limit: 5 },
        cacheTTL: 15000, // 15 seconds
        forceRefresh: force
      })
      
      setBalance(data.balance || 0)
      setLockedBalance(data.locked_balance || 0)
      setAvailableBalance(data.available || data.balance - data.locked_balance || 0)
      setTransactions(data.transactions || [])
      
      // Get the most recent payment (credit transaction)
      const recentCredit = data.transactions?.find((tx: WalletTransaction) => tx.direction === 'credit')
      setRecentPayment(recentCredit?.amount || 0)
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch wallet data')
      console.error('Wallet fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [authState.isAuthenticated])

  useEffect(() => {
    if (authState.isAuthenticated) {
      refreshWallet()
    }
  }, [authState.isAuthenticated, refreshWallet])

  const value = {
    balance,
    lockedBalance,
    availableBalance,
    recentPayment,
    transactions,
    loading,
    error,
    refreshWallet
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = () => {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
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
  recentPayment: number
  transactions: WalletTransaction[]
  loading: boolean
  error: string | null
  refreshWallet: () => Promise<void>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { state: authState } = useAuth()
  const [balance, setBalance] = useState(0)
  const [lockedBalance, setLockedBalance] = useState(0)
  const [recentPayment, setRecentPayment] = useState(0)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshWallet = async () => {
    if (!authState.isAuthenticated) return
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.get('/wallet?limit=5')
      const data = response.data
      
      setBalance(data.balance || 0)
      setLockedBalance(data.locked_balance || 0)
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
  }

  useEffect(() => {
    if (authState.isAuthenticated) {
      refreshWallet()
    }
  }, [authState.isAuthenticated])

  const value = {
    balance,
    lockedBalance,
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
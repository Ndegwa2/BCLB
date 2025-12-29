import React, { useState, useEffect } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { useAuth } from '../contexts/AuthContext'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { apiClient } from '../services/api'

// Type definitions for better type safety
interface Transaction {
  id: string | number
  tx_type: string
  status: string
  amount: number
  direction: 'credit' | 'debit'
  created_at: string
  description?: string
}

interface TransactionStatus {
  text: string
  color: string
}

const Wallet: React.FC = () => {
  const { balance, lockedBalance, transactions, loading, error, refreshWallet } = useWallet()
  const { state: authState } = useAuth()
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [transactionStatus, setTransactionStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  // Validate phone number format
  const validatePhoneNumber = (phone: string): boolean => {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '')

    // Check minimum length (10 digits)
    if (digitsOnly.length < 10) {
      return false
    }

    // Check maximum length (15 digits for international numbers)
    if (digitsOnly.length > 15) {
      return false
    }

    // Basic country code validation
    if (digitsOnly.startsWith('0')) {
      // Local numbers should not start with 0
      return false
    }

    // Check if it starts with country code (common patterns)
    const validStarts = ['254', '1', '44', '33', '49', '81', '86'] // Kenya, US, UK, France, Germany, Japan, China
    if (digitsOnly.length >= 11 && !validStarts.some(code => digitsOnly.startsWith(code))) {
      return false
    }

    return true
  }

  // Handle deposit
  const handleDeposit = async () => {
    console.log('Deposit attempt - Amount:', depositAmount, 'Phone:', phoneNumber)

    if (!depositAmount || isNaN(parseFloat(depositAmount)) || parseFloat(depositAmount) <= 0) {
      console.log('Invalid deposit amount')
      setTransactionStatus({ type: 'error', message: 'Please enter a valid deposit amount' })
      return
    }

    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
      console.log('Invalid phone number format:', phoneNumber)
      setTransactionStatus({ type: 'error', message: 'Please enter a valid phone number (10-15 digits, no leading zeros, include country code for international numbers)' })
      return
    }

    try {
      console.log('Sending deposit request to API')
      const response = await apiClient.post('/wallet/deposit', {
        amount: parseFloat(depositAmount),
        phone_number: phoneNumber
      })

      console.log('Deposit successful:', response.data)
      setTransactionStatus({ type: 'success', message: 'Deposit request submitted successfully' })
      refreshWallet()
      setShowDepositModal(false)
      setDepositAmount('')
      setPhoneNumber('')
    } catch (err: any) {
      console.error('Deposit error:', err)
      console.error('Error response:', err.response?.data)

      // Enhanced error handling
      let errorMessage = 'Failed to process deposit'

      if (err.response) {
        if (err.response.status === 400) {
          errorMessage = 'Invalid request: ' + (err.response.data.error || 'Please check your input')
        } else if (err.response.status === 401) {
          errorMessage = 'Authentication required: Please login again'
        } else if (err.response.status === 403) {
          errorMessage = 'Access denied: You do not have permission for this action'
        } else if (err.response.status === 422) {
          errorMessage = 'Validation error: ' + (err.response.data.error || 'Please check your input')
        } else if (err.response.status === 500) {
          errorMessage = 'Server error: Please try again later'
        } else if (err.response.data && err.response.data.error) {
          errorMessage = err.response.data.error
        }
      } else if (err.request) {
        errorMessage = 'Network error: Please check your internet connection'
      } else {
        errorMessage = 'Request setup error: ' + err.message
      }

      setTransactionStatus({
        type: 'error',
        message: errorMessage
      })
    }
  }

  // Handle withdrawal
  const handleWithdrawal = async () => {
    console.log('Withdrawal attempt - Amount:', withdrawAmount, 'Phone:', phoneNumber, 'Balance:', balance)

    if (!withdrawAmount || isNaN(parseFloat(withdrawAmount)) || parseFloat(withdrawAmount) <= 0) {
      console.log('Invalid withdrawal amount')
      setTransactionStatus({ type: 'error', message: 'Please enter a valid withdrawal amount' })
      return
    }

    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
      console.log('Invalid phone number format:', phoneNumber)
      setTransactionStatus({ type: 'error', message: 'Please enter a valid phone number (10-15 digits, no leading zeros, include country code for international numbers)' })
      return
    }

    if (parseFloat(withdrawAmount) > balance) {
      console.log('Insufficient balance - Requested:', withdrawAmount, 'Available:', balance)
      setTransactionStatus({ type: 'error', message: `Insufficient balance for withdrawal. Available: ${formatCurrency(balance)}` })
      return
    }

    try {
      console.log('Sending withdrawal request to API')
      const response = await apiClient.post('/wallet/withdraw', {
        amount: parseFloat(withdrawAmount),
        phone_number: phoneNumber
      })

      console.log('Withdrawal successful:', response.data)
      setTransactionStatus({ type: 'success', message: 'Withdrawal request submitted successfully' })
      refreshWallet()
      setShowWithdrawModal(false)
      setWithdrawAmount('')
      setPhoneNumber('')
    } catch (err: any) {
      console.error('Withdrawal error:', err)
      console.error('Error response:', err.response?.data)

      // Enhanced error handling
      let errorMessage = 'Failed to process withdrawal'

      if (err.response) {
        if (err.response.status === 400) {
          errorMessage = 'Invalid request: ' + (err.response.data.error || 'Please check your input')
        } else if (err.response.status === 401) {
          errorMessage = 'Authentication required: Please login again'
        } else if (err.response.status === 403) {
          errorMessage = 'Access denied: You do not have permission for this action'
        } else if (err.response.status === 422) {
          errorMessage = 'Validation error: ' + (err.response.data.error || 'Please check your input')
        } else if (err.response.status === 500) {
          errorMessage = 'Server error: Please try again later'
        } else if (err.response.data && err.response.data.error) {
          errorMessage = err.response.data.error
        }
      } else if (err.request) {
        errorMessage = 'Network error: Please check your internet connection'
      } else {
        errorMessage = 'Request setup error: ' + err.message
      }

      setTransactionStatus({
        type: 'error',
        message: errorMessage
      })
    }
  }

  // Get transaction type display name
  const getTransactionTypeDisplay = (type: string): string => {
    console.log('Transaction type mapping:', type)
    const typeMap: Record<string, string> = {
      'deposit': 'Deposit',
      'withdrawal': 'Withdrawal',
      'game_win': 'Game Win',
      'game_loss': 'Game Loss',
      'house_cut': 'House Cut',
      'tournament_win': 'Tournament Win',
      'tournament_entry': 'Tournament Entry'
    }
    const result = typeMap[type] || type
    console.log('Mapped type:', type, '->', result)
    return result
  }

  // Get transaction status display
  const getStatusDisplay = (status: string): TransactionStatus => {
    console.log('Transaction status mapping:', status)
    const statusMap: Record<string, TransactionStatus> = {
      'pending': { text: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      'success': { text: 'Success', color: 'bg-green-100 text-green-800' },
      'failed': { text: 'Failed', color: 'bg-red-100 text-red-800' }
    }
    const result = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' }
    console.log('Mapped status:', status, '->', result)
    return result
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Wallet</h1>

          {/* Transaction Status Alert */}
          {transactionStatus.type && (
            <div className={`mb-6 p-4 rounded-md ${
              transactionStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {transactionStatus.message}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-md">
              {error}
              <button
                onClick={refreshWallet}
                className="ml-4 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                Retry
              </button>
            </div>
          )}

          {/* Wallet Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Available Balance</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">
                {loading ? <LoadingSpinner size="sm" /> : formatCurrency(balance)}
              </div>
              <div className="mt-1 text-sm text-gray-500">Available for games and withdrawals</div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Locked Balance</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">
                {loading ? <LoadingSpinner size="sm" /> : formatCurrency(lockedBalance)}
              </div>
              <div className="mt-1 text-sm text-gray-500">Pending transactions</div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Balance</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">
                {loading ? <LoadingSpinner size="sm" /> : formatCurrency(balance + lockedBalance)}
              </div>
              <div className="mt-1 text-sm text-gray-500">Available + Locked</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-8">
            <button
              onClick={() => setShowDepositModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Deposit Funds
            </button>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Withdraw Funds
            </button>
            <button
              onClick={refreshWallet}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Refresh
            </button>
          </div>

          {/* Transaction History */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
              <span className="text-sm text-gray-500">
                Showing {transactions.length} of {transactions.length} transactions
              </span>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No transactions found. Your transaction history will appear here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => {
                      console.log('Rendering transaction:', {
                        id: transaction.id,
                        type: transaction.tx_type,
                        status: transaction.status,
                        amount: transaction.amount,
                        direction: transaction.direction,
                        created_at: transaction.created_at
                      })
                      return (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(transaction.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.description || getTransactionTypeDisplay(transaction.tx_type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getTransactionTypeDisplay(transaction.tx_type)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                          transaction.direction === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.direction === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusDisplay(transaction.status).color}`}>
                            {getStatusDisplay(transaction.status).text}
                          </span>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Deposit Funds</h3>
              <button
                onClick={() => setShowDepositModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (USD)
                </label>
                <input
                  type="number"
                  id="depositAmount"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter deposit amount"
                  min="1"
                  step="0.01"
                />
              </div>

              <div>
                <label htmlFor="depositPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number (for payment confirmation)
                </label>
                <input
                  type="tel"
                  id="depositPhone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter phone number"
                />
              </div>

              <p className="text-sm text-gray-500">
                Deposit instructions will be sent to your phone number via SMS.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  aria-label="Cancel deposit"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeposit}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  aria-label="Confirm deposit"
                >
                  Confirm Deposit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg p-6 w-full max-w-md" role="document">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900" id="withdraw-modal-title">Withdraw Funds</h3>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close withdraw modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="withdrawAmount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (USD)
                </label>
                <input
                  type="number"
                  id="withdrawAmount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter withdrawal amount"
                  min="1"
                  step="0.01"
                  max={balance}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available balance: {formatCurrency(balance)}
                </p>
              </div>

              <div>
                <label htmlFor="withdrawPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number (for payment confirmation)
                </label>
                <input
                  type="tel"
                  id="withdrawPhone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone number"
                />
              </div>

              <p className="text-sm text-gray-500">
                Withdrawal instructions will be sent to your phone number via SMS.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  aria-label="Cancel withdrawal"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdrawal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  aria-label="Confirm withdrawal"
                >
                  Confirm Withdrawal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Wallet
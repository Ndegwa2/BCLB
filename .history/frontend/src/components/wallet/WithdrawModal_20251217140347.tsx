import React, { useState } from 'react'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { apiClient } from '../../services/api'

interface WithdrawModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  availableBalance: number
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  availableBalance
}) => {
  const [amount, setAmount] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validatePhoneNumber = (phone: string): boolean => {
    const digitsOnly = phone.replace(/\D/g, '')
    return digitsOnly.length >= 10 && digitsOnly.length <= 15
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const amountValue = parseFloat(amount)
    if (!amount || isNaN(amountValue) || amountValue <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (amountValue > availableBalance) {
      setError(`Insufficient balance. Available: $${availableBalance.toFixed(2)}`)
      return
    }

    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number (10-15 digits)')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.post('/wallet/withdraw', {
        amount: amountValue,
        phone_number: phoneNumber
      })

      onSuccess()
      handleClose()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process withdrawal')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setAmount('')
    setPhoneNumber('')
    setError(null)
    onClose()
  }

  const quickAmounts = [10, 25, 50, 100].filter(val => val <= availableBalance)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg p-6 w-full max-w-md" role="document">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">💸 Withdraw Funds</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close withdrawal modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Input */}
          <div>
            <label htmlFor="withdrawAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount (USD)
            </label>
            <input
              type="number"
              id="withdrawAmount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter withdrawal amount"
              min="1"
              max={availableBalance}
              step="0.01"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Available balance: ${availableBalance.toFixed(2)}
            </p>
            
            {/* Quick Amount Buttons */}
            {quickAmounts.length > 0 && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {quickAmounts.map((quickAmount) => (
                  <button
                    key={quickAmount}
                    type="button"
                    onClick={() => setAmount(quickAmount.toString())}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    ${quickAmount}
                  </button>
                ))}
                {availableBalance >= 100 && (
                  <button
                    type="button"
                    onClick={() => setAmount(availableBalance.toString())}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Max (${availableBalance.toFixed(2)})
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Phone Number Input */}
          <div>
            <label htmlFor="withdrawPhone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="withdrawPhone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+254712345678"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              For M-Pesa payment confirmation
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Information Box */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-400">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Note:</strong> Minimum withdrawal amount is $1.00. Withdrawals typically complete within 2-5 minutes.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Processing...</span>
                </>
              ) : (
                '💸 Confirm Withdrawal'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default WithdrawModal
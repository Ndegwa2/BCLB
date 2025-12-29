import React, { useState } from 'react'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { apiClient } from '../../services/api'

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  availableBalance: number
}

const DepositModal: React.FC<DepositModalProps> = ({
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

    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number (10-15 digits)')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.post('/wallet/deposit', {
        amount: amountValue,
        phone_number: phoneNumber
      })

      onSuccess()
      handleClose()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process deposit')
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg p-6 w-full max-w-md" role="document">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">📱 Deposit Funds</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close deposit modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Input */}
          <div>
            <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount (USD)
            </label>
            <input
              type="number"
              id="depositAmount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter deposit amount"
              min="1"
              step="0.01"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Current balance: ${availableBalance.toFixed(2)}
            </p>
          </div>

          {/* Phone Number Input */}
          <div>
            <label htmlFor="depositPhone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="depositPhone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-blue-400">💡</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>How it works:</strong> You'll receive an M-Pesa prompt on your phone to complete the payment.
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
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Processing...</span>
                </>
              ) : (
                '💰 Confirm Deposit'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DepositModal
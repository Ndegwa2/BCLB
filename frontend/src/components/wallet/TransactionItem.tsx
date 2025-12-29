import React from 'react'

interface WalletTransaction {
  id: number
  amount: number
  direction: 'credit' | 'debit'
  tx_type: string
  status: string
  description: string
  created_at: string
}

interface TransactionItemProps {
  transaction: WalletTransaction
  onClick?: () => void
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onClick }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const getTransactionTypeDisplay = (type: string): { icon: string; label: string; color: string } => {
    const typeMap: Record<string, { icon: string; label: string; color: string }> = {
      'deposit': { icon: '💰', label: 'Deposit', color: 'text-green-600' },
      'withdrawal': { icon: '💸', label: 'Withdrawal', color: 'text-blue-600' },
      'game_win': { icon: '🎉', label: 'Game Win', color: 'text-green-600' },
      'game_loss': { icon: '❌', label: 'Game Loss', color: 'text-red-600' },
      'house_cut': { icon: '🏠', label: 'House Cut', color: 'text-gray-600' },
      'tournament_win': { icon: '🏆', label: 'Tournament Win', color: 'text-green-600' },
      'tournament_entry': { icon: '🎯', label: 'Tournament Entry', color: 'text-orange-600' }
    }
    
    return typeMap[type] || { icon: '💳', label: type, color: 'text-gray-600' }
  }

  const getStatusDisplay = (status: string): { label: string; color: string } => {
    const statusMap: Record<string, { label: string; color: string }> = {
      'pending': { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      'success': { label: 'Success', color: 'bg-green-100 text-green-800' },
      'failed': { label: 'Failed', color: 'bg-red-100 text-red-800' }
    }
    
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' }
  }

  const typeInfo = getTransactionTypeDisplay(transaction.tx_type)
  const statusInfo = getStatusDisplay(transaction.status)

  return (
    <div
      className={`
        bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer
        ${onClick ? 'hover:border-blue-300' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Transaction Icon */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${transaction.direction === 'credit' ? 'bg-green-100' : 'bg-red-100'}`}>
            <span className="text-lg">{typeInfo.icon}</span>
          </div>
          
          {/* Transaction Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className={`text-sm font-medium ${typeInfo.color}`}>
                {typeInfo.label}
              </p>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {transaction.description || typeInfo.label}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {formatDate(transaction.created_at)}
            </p>
          </div>
        </div>

        {/* Amount */}
        <div className="text-right">
          <p className={`text-lg font-semibold ${
            transaction.direction === 'credit' ? 'text-green-600' : 'text-red-600'
          }`}>
            {transaction.direction === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
          </p>
          <p className="text-xs text-gray-400">
            Ref: #{transaction.id}
          </p>
        </div>
      </div>

      {/* Additional Details (expandable on hover) */}
      {onClick && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Transaction ID: {transaction.id}</span>
            <span>Type: {transaction.tx_type}</span>
            <span>Status: {transaction.status}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default TransactionItem
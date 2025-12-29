import React, { useState } from 'react'

interface QuickActionsProps {
  onDeposit: () => void
  onWithdraw: () => void
  onRefresh: () => void
  loading?: boolean
}

interface ActionButton {
  id: string
  label: string
  icon: string
  color: 'green' | 'blue' | 'gray' | 'purple'
  action: () => void
  loading?: boolean
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onDeposit,
  onWithdraw,
  onRefresh,
  loading = false
}) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const actions: ActionButton[] = [
    {
      id: 'deposit',
      label: 'Deposit Funds',
      icon: '📱',
      color: 'green',
      action: () => {
        setActionLoading('deposit')
        onDeposit()
        setTimeout(() => setActionLoading(null), 1000)
      },
      loading: actionLoading === 'deposit'
    },
    {
      id: 'withdraw',
      label: 'Withdraw Funds',
      icon: '💸',
      color: 'blue',
      action: () => {
        setActionLoading('withdraw')
        onWithdraw()
        setTimeout(() => setActionLoading(null), 1000)
      },
      loading: actionLoading === 'withdraw'
    },
    {
      id: 'refresh',
      label: 'Refresh Balance',
      icon: '🔄',
      color: 'gray',
      action: () => {
        setActionLoading('refresh')
        onRefresh()
        setTimeout(() => setActionLoading(null), 1000)
      },
      loading: actionLoading === 'refresh'
    }
  ]

  const colorClasses = {
    green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    gray: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500',
    purple: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      
      <div className="flex flex-wrap gap-4">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            disabled={loading || action.loading}
            className={`
              inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white
              focus:outline-none focus:ring-2 focus:ring-offset-2
              ${colorClasses[action.color]}
              ${(loading || action.loading) ? 'opacity-50 cursor-not-allowed' : 'transition-colors duration-200'}
            `}
          >
            <span className="mr-2">{action.icon}</span>
            {action.loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              action.label
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-blue-400 text-sm">💡</span>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Quick Tip:</strong> All deposits and withdrawals are processed instantly via M-Pesa integration. 
              Transaction fees may apply.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuickActions
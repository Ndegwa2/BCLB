import React from 'react'
import { LoadingSpinner } from '../ui/LoadingSpinner'

interface BalanceCardProps {
  title: string
  amount: number
  subtitle?: string
  icon?: string
  color?: 'green' | 'red' | 'blue' | 'gray'
  loading?: boolean
  className?: string
}

const BalanceCard: React.FC<BalanceCardProps> = ({
  title,
  amount,
  subtitle,
  icon = '💰',
  color = 'green',
  loading = false,
  className = ''
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const colorClasses = {
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
    blue: 'bg-blue-50 border-blue-200',
    gray: 'bg-gray-50 border-gray-200'
  }

  const textColorClasses = {
    green: 'text-green-700',
    red: 'text-red-700',
    blue: 'text-blue-700',
    gray: 'text-gray-700'
  }

  const amountColorClasses = {
    green: 'text-green-800',
    red: 'text-red-800',
    blue: 'text-blue-800',
    gray: 'text-gray-800'
  }

  return (
    <div className={`bg-white rounded-lg border shadow-sm p-6 ${colorClasses[color]} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            {icon} {title}
          </div>
          <div className="mt-2">
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <div className={`text-3xl font-bold ${amountColorClasses[color]}`}>
                {formatCurrency(amount)}
              </div>
            )}
          </div>
          {subtitle && (
            <div className="mt-1 text-sm text-gray-500">
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BalanceCard
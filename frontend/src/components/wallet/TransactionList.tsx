import React, { useState, useMemo } from 'react'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import TransactionItem from './TransactionItem'

interface WalletTransaction {
  id: number
  amount: number
  direction: 'credit' | 'debit'
  tx_type: string
  status: string
  description: string
  created_at: string
}

interface TransactionListProps {
  transactions: WalletTransaction[]
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
  onTransactionClick?: (transaction: WalletTransaction) => void
}

type FilterType = 'all' | 'deposits' | 'withdrawals' | 'games' | 'tournaments'

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  loading = false,
  error,
  onRefresh,
  onTransactionClick
}) => {
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Filter configurations
  const filterConfig = {
    all: { label: 'All Transactions', icon: '📊', count: transactions.length },
    deposits: { label: 'Deposits', icon: '💰', count: transactions.filter(t => t.tx_type === 'deposit').length },
    withdrawals: { label: 'Withdrawals', icon: '💸', count: transactions.filter(t => t.tx_type === 'withdrawal').length },
    games: { label: 'Games', icon: '🎮', count: transactions.filter(t => t.tx_type.includes('game_')).length },
    tournaments: { label: 'Tournaments', icon: '🏆', count: transactions.filter(t => t.tx_type.includes('tournament_')).length }
  }

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions

    // Apply type filter
    switch (currentFilter) {
      case 'deposits':
        filtered = filtered.filter(t => t.tx_type === 'deposit')
        break
      case 'withdrawals':
        filtered = filtered.filter(t => t.tx_type === 'withdrawal')
        break
      case 'games':
        filtered = filtered.filter(t => t.tx_type.includes('game_'))
        break
      case 'tournaments':
        filtered = filtered.filter(t => t.tx_type.includes('tournament_'))
        break
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t => 
        t.description?.toLowerCase().includes(query) ||
        t.tx_type.toLowerCase().includes(query) ||
        t.status.toLowerCase().includes(query)
      )
    }

    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [transactions, currentFilter, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage)

  // Reset pagination when filter changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [currentFilter, searchQuery])

  const handleFilterChange = (filter: FilterType) => {
    setCurrentFilter(filter)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            i === currentPage
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          {i}
        </button>
      )
    }

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div className="flex justify-between flex-1 sm:hidden">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">{startIndex + 1}</span>
              {' '}to{' '}
              <span className="font-medium">
                {Math.min(startIndex + itemsPerPage, filteredTransactions.length)}
              </span>
              {' '}of{' '}
              <span className="font-medium">{filteredTransactions.length}</span>
              {' '}results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {pages}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Transactions</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
          
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">🔍</span>
            </div>
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mt-4">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {Object.entries(filterConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => handleFilterChange(key as FilterType)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    currentFilter === key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {config.icon} {config.label} ({config.count})
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : paginatedTransactions.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery 
              ? `No transactions match "${searchQuery}"` 
              : currentFilter !== 'all' 
                ? `No ${filterConfig[currentFilter].label.toLowerCase()} found`
                : 'Your transaction history will appear here'
            }
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-blue-600 hover:text-blue-700"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        /* Transaction List */
        <div className="divide-y divide-gray-200">
          {paginatedTransactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              onClick={() => onTransactionClick?.(transaction)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {renderPagination()}
    </div>
  )
}

export default TransactionList
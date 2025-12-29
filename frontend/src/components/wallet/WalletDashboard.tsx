import React, { useState } from 'react'
import { useWallet } from '../../contexts/WalletContext'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import BalanceCard from './BalanceCard'
import QuickActions from './QuickActions'
import TransactionList from './TransactionList'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'

interface WalletTransaction {
  id: number
  amount: number
  direction: 'credit' | 'debit'
  tx_type: string
  status: string
  description: string
  created_at: string
}

interface WalletDashboardProps {
  className?: string
}

const WalletDashboard: React.FC<WalletDashboardProps> = ({ className = '' }) => {
  const {
    balance,
    lockedBalance,
    transactions,
    loading,
    error,
    refreshWallet
  } = useWallet()

  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info'
    message: string
  } | null>(null)

  const totalBalance = balance + lockedBalance

  const handleDeposit = () => {
    setShowDepositModal(true)
  }

  const handleWithdraw = () => {
    setShowWithdrawModal(true)
  }

  const handleRefresh = async () => {
    try {
      await refreshWallet()
      setNotification({
        type: 'success',
        message: 'Wallet balance refreshed successfully'
      })
      setTimeout(() => setNotification(null), 3000)
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'Failed to refresh wallet balance'
      })
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const handleDepositSuccess = () => {
    setShowDepositModal(false)
    setNotification({
      type: 'success',
      message: 'Deposit request submitted successfully! You will receive an M-Pesa prompt shortly.'
    })
    setTimeout(() => setNotification(null), 5000)
    refreshWallet()
  }

  const handleWithdrawSuccess = () => {
    setShowWithdrawModal(false)
    setNotification({
      type: 'success',
      message: 'Withdrawal request submitted successfully! Funds will be sent to your M-Pesa within 2-5 minutes.'
    })
    setTimeout(() => setNotification(null), 5000)
    refreshWallet()
  }

  const handleTransactionClick = (transaction: WalletTransaction) => {
    // For now, just show a simple alert. In a real app, this could open a detailed transaction modal
    alert(`Transaction Details:\n\nID: ${transaction.id}\nType: ${transaction.tx_type}\nAmount: $${transaction.amount}\nStatus: ${transaction.status}\nDate: ${new Date(transaction.created_at).toLocaleString()}`)
  }

  if (error) {
    return (
      <div className={`min-h-screen bg-gray-50 ${className}`}>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Wallet Error</h1>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              💰 Wallet Dashboard
            </h1>
            <p className="mt-2 text-gray-600">
              Manage your funds, view transactions, and handle deposits/withdrawals
            </p>
          </div>

          {/* Notification */}
          {notification && (
            <div className={`mb-6 p-4 rounded-md ${
              notification.type === 'success' ? 'bg-green-100 text-green-800' :
              notification.type === 'error' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {notification.type === 'success' && '✅'}
                  {notification.type === 'error' && '❌'}
                  {notification.type === 'info' && 'ℹ️'}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{notification.message}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setNotification(null)}
                    className="inline-flex text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <BalanceCard
              title="Available Balance"
              amount={balance}
              subtitle="Available for games and withdrawals"
              icon="💰"
              color="green"
              loading={loading}
            />
            <BalanceCard
              title="Locked Balance"
              amount={lockedBalance}
              subtitle="In active games and tournaments"
              icon="🔒"
              color="red"
              loading={loading}
            />
            <BalanceCard
              title="Total Balance"
              amount={totalBalance}
              subtitle="Available + Locked"
              icon="📊"
              color="blue"
              loading={loading}
            />
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <QuickActions
              onDeposit={handleDeposit}
              onWithdraw={handleWithdraw}
              onRefresh={handleRefresh}
              loading={loading}
            />
          </div>

          {/* Transaction History */}
          <div>
            <TransactionList
              transactions={transactions}
              loading={loading}
              error={error}
              onRefresh={handleRefresh}
              onTransactionClick={handleTransactionClick}
            />
          </div>

          {/* Footer Information */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-blue-400 text-lg">💡</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Wallet Information</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>All deposits and withdrawals are processed instantly via M-Pesa</li>
                    <li>Transaction fees may apply: Deposits (1%), Withdrawals (1.5%)</li>
                    <li>Minimum deposit: $1.00, Minimum withdrawal: $1.00</li>
                    <li>For support, contact us at support@gamelogic.com</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onSuccess={handleDepositSuccess}
        availableBalance={balance}
      />

      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        onSuccess={handleWithdrawSuccess}
        availableBalance={balance}
      />
    </div>
  )
}

export default WalletDashboard
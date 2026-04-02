import React from 'react'
import { CreateTournamentForm } from '../components/tournaments/CreateTournamentForm'
import { TournamentList } from '../components/tournaments/TournamentList'
import { useAuth } from '../contexts/AuthContext'
import { useWallet } from '../contexts/WalletContext'

const Tournaments: React.FC = () => {
  const { state: authState } = useAuth()
  const { balance } = useWallet()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Home</span>
              <span>›</span>
              <span className="text-gray-700 font-medium">Tournaments</span>
            </nav>
          </div>

          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tournament Lobby</h1>
              <p className="text-gray-600 mt-1">Join competitive tournaments and win big prizes</p>
            </div>

            {/* User Balance Display */}
            {authState.isAuthenticated && (
              <div className="mt-4 md:mt-0 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                <span className="text-sm text-gray-600">Your Balance: </span>
                <span className="font-bold text-green-600">KES {balance.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Create Tournament Section (Admin Only) */}
          {authState.isAuthenticated && authState.user?.is_admin && (
            <CreateTournamentForm />
          )}

          {/* Open Tournaments Section */}
          <TournamentList />

          {/* Quick Info Section */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">💡 Tournament Tips</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Tournaments have entry fees and prize pools</li>
              <li>• Join open tournaments to compete for prizes</li>
              <li>• Check tournament details before joining</li>
              <li>• Winners receive 85% of the total prize pool</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Tournaments
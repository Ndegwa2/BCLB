import React from 'react'
import { CreateGameForm } from '../components/games/CreateGameForm'
import { GameList } from '../components/games/GameList'
import { useAuth } from '../contexts/AuthContext'

const Games: React.FC = () => {
  const { state: authState } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Home</span>
              <span>›</span>
              <span className="text-gray-700 font-medium">Games</span>
            </nav>
          </div>

          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Game Lobby</h1>
              <p className="text-gray-600 mt-1">Browse, create, and join games</p>
            </div>

            {/* User Balance Display */}
            {authState.isAuthenticated && (
              <div className="mt-4 md:mt-0 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                <span className="text-sm text-gray-600">Your Balance: </span>
                <span className="font-bold text-green-600">KES 1,250.00</span>
              </div>
            )}
          </div>

          {/* Create Game Section */}
          <CreateGameForm />

          {/* Open Games Section */}
          <GameList />

          {/* Quick Info Section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">💡 Quick Tips</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Create games with different stake amounts</li>
              <li>• Join open games to play against others</li>
              <li>• Check game details before joining</li>
              <li>• Your balance is displayed at the top right</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Games
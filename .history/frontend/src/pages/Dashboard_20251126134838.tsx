import React from 'react'
import { useAuth } from '../contexts/AuthContext'

const Dashboard: React.FC = () => {
  const { state } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {state.user?.username || 'User'}!
          </h1>
          <p className="mt-2 text-gray-600">
            This is your gaming dashboard where you can view your games, tournaments, and wallet.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
import React from 'react'
import { useAuth } from '../../contexts/AuthContext'

interface AdminTopBarProps {
  title: string
}

const AdminTopBar: React.FC<AdminTopBarProps> = ({ title }) => {
  const { state, logout } = useAuth()

  return (
    <div className="fixed top-0 left-64 right-0 h-20 bg-slate-800 z-20 flex items-center justify-between px-8">
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      
      <div className="flex items-center space-x-4">
        {/* User Profile */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">
              {state.user?.username?.charAt(0).toUpperCase() || '👤'}
            </span>
          </div>
          <div className="text-white">
            <p className="text-sm font-medium">{state.user?.username || 'Admin'}</p>
            <p className="text-xs text-gray-300">Administrator</p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
        >
          Logout
        </button>
      </div>
    </div>
  )
}

export default AdminTopBar
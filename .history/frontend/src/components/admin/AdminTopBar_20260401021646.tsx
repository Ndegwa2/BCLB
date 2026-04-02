import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LogOut, User } from 'lucide-react'

interface AdminTopBarProps {
  title: string
}

const AdminTopBar: React.FC<AdminTopBarProps> = ({ title }) => {
  const { state, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-slate-800 border-b border-slate-700">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left side - Title */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">G</span>
          </div>
          <h1 className="text-white font-bold text-xl">{title}</h1>
        </div>

        {/* Right side - User info and Logout */}
        <div className="flex items-center gap-4">
          {/* User Info */}
          <div className="flex items-center gap-3 bg-slate-700/50 px-4 py-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-white text-sm font-medium">{state.user?.username || 'Admin'}</p>
              <p className="text-slate-400 text-xs">Administrator</p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminTopBar
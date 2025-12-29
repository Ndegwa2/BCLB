import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

interface MainTopBarProps {
  title: string
}

const MainTopBar: React.FC<MainTopBarProps> = ({ title }) => {
  const { state, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div
      className="fixed top-0 z-20 flex items-center justify-between"
      style={{
        left: '72px', // Account for player sidebar width
        right: '0px',
        height: '80px',
        backgroundColor: '#1e293b',
        paddingLeft: '24px',
        paddingRight: '24px'
      }}
    >
      <h1
        className="text-white font-bold"
        style={{ fontSize: '24px' }}
      >
        {title}
      </h1>

      {/* User Profile and Logout */}
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <div className="text-white font-semibold text-sm">
            {state.user?.username || 'Player'}
          </div>
          <div className="text-slate-400 text-xs">Player</div>
        </div>

        {/* User Avatar */}
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer">
          <div className="relative">
            <div className="w-5 h-5 bg-yellow-400 rounded-full"></div>
            <div className="w-2.5 h-2.5 bg-orange-300 rounded-full absolute -top-0.5 left-0.5"></div>
            <div className="w-5 h-2.5 bg-orange-400 rounded-full absolute -bottom-0.5 left-0"></div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  )
}

export default MainTopBar
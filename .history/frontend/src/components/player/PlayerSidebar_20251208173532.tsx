import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface PlayerSidebarProps {
  className?: string
}

const PlayerSidebar: React.FC<PlayerSidebarProps> = ({ className = '' }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: (
        <path d="M-8 0h16" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      )
    },
    {
      id: 'games',
      label: 'Games',
      path: '/games',
      icon: (
        <>
          <path d="M16 30h20M26 20v20" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        </>
      )
    },
    {
      id: 'tournaments',
      label: 'Tournaments',
      path: '/tournaments',
      icon: (
        <path d="M16 28h20" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      )
    },
    {
      id: 'wallet',
      label: 'Wallet',
      path: '/wallet',
      icon: (
        <path d="M20 20c8 0 8 12 0 12s-8-12 0-12z" fill="#9fb9ff" />
      )
    },
    {
      id: 'profile',
      label: 'Profile',
      path: '/profile',
      icon: (
        <>
          <path d="M18 20h16M18 32h16" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        </>
      )
    }
  ]

  return (
    <div className={`fixed left-0 top-0 h-full bg-slate-900 w-18 z-40 ${className}`}>
      <div className="p-3">
        {/* Navigation Menu */}
        <nav className="mt-6">
          {menuItems.map((item, _index) => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-13 h-13 rounded-xl mb-3 flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 shadow-lg'
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
                title={item.label}
              >
                <div className="w-6 h-6" style={{ filter: isActive ? 'brightness(1.5)' : 'brightness(1)' }}>
                  {item.icon}
                </div>
              </button>
            )
          })}
        </nav>

        {/* User Profile at Bottom */}
        <div className="absolute bottom-6 left-3">
          <div className="w-15 h-15 rounded-full bg-slate-700 flex items-center justify-center">
            <div className="relative">
              {/* User Avatar */}
              <div className="w-6 h-6 bg-yellow-400 rounded-full"></div>
              <div className="w-3 h-3 bg-orange-300 rounded-full absolute -top-1 left-1.5"></div>
              <div className="w-6 h-3 bg-orange-400 rounded-full absolute -bottom-1 left-0"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlayerSidebar
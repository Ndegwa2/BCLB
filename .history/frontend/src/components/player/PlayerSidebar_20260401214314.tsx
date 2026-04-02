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
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M-8 0h16" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    },
    {
      id: 'play-vs-ai',
      label: 'Play vs AI',
      path: '/play-vs-ai',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" fill="#ffffff"/>
          <path d="M12 6a1 1 0 0 0-1 1v4a1 1 0 0 0 .29.71l3 3a1 1 0 0 0 1.42-1.42L13 10.59V7a1 1 0 0 0-1-1z" fill="#ffffff"/>
        </svg>
      )
    },
    {
      id: 'games',
      label: 'Games',
      path: '/games',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 30h20M26 20v20" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    },
    {
      id: 'tournaments',
      label: 'Tournaments',
      path: '/tournaments',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 28h20" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    },
    {
      id: 'wallet',
      label: 'Wallet',
      path: '/wallet',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 20c8 0 8 12 0 12s-8-12 0-12z" fill="#ffffff" />
        </svg>
      )
    },
    {
      id: 'profile',
      label: 'Profile',
      path: '/profile',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 20h16M18 32h16" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    }
  ]

  return (
      <div className={`fixed left-0 top-0 h-full bg-slate-900 w-64 z-40 ${className}`}>
        <div className="p-3">
          {/* Navigation Menu */}
          <nav className="mt-6">
            {menuItems.map((item, _index) => {
              const isActive = location.pathname === item.path
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`w-full h-14 rounded-xl mb-3 flex items-center justify-start pl-4 transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 shadow-lg'
                      : 'bg-slate-800 hover:bg-slate-700'
                  }`}
                >
                  <div className="w-6 h-6 mr-4" style={{ filter: isActive ? 'brightness(1.5)' : 'brightness(1)' }}>
                    {item.icon}
                  </div>
                  <span className={`text-white font-medium ${isActive ? 'text-blue-100' : 'text-slate-300'}`}>
                    {item.label}
                  </span>
                </button>
              )
            })}
          </nav>

        {/* User Profile at Bottom */}
                <div className="absolute bottom-6 left-4">
                  <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center">
                    <div className="relative">
                      {/* User Avatar */}
                      <div className="w-7 h-7 bg-yellow-400 rounded-full"></div>
                      <div className="w-3.5 h-3.5 bg-orange-300 rounded-full absolute -top-1 left-1.5"></div>
                      <div className="w-7 h-3.5 bg-orange-400 rounded-full absolute -bottom-1 left-0"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
}

export default PlayerSidebar
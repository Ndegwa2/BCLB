import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  Bot, 
  Gamepad2, 
  Trophy, 
  Wallet, 
  User,
  ChevronRight
} from 'lucide-react'

interface MenuItem {
  id: string
  label: string
  path: string
  icon: React.ElementType
}

interface PlayerSidebarProps {
  className?: string
}

const PlayerSidebar: React.FC<PlayerSidebarProps> = ({ className = '' }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { id: 'play-vs-ai', label: 'Play vs AI', path: '/play-vs-ai', icon: Bot },
    { id: 'games', label: 'Games', path: '/games', icon: Gamepad2 },
    { id: 'tournaments', label: 'Tournaments', path: '/tournaments', icon: Trophy },
    { id: 'wallet', label: 'Wallet', path: '/wallet', icon: Wallet },
    { id: 'profile', label: 'Profile', path: '/profile', icon: User }
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className={`fixed left-0 top-0 h-full bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 w-64 z-40 ${className}`}>
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            GameHub
          </span>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4 mt-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">
          Navigation
        </p>
        <div className="space-y-1">
          {menuItems.map((item) => {
            const active = isActive(item.path)
            const Icon = item.icon
            return (
              <motion.button
                key={item.id}
                onClick={() => navigate(item.path)}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {active && (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </motion.button>
            )
          })}
        </div>
      </nav>

      {/* User Profile at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
        <button
          onClick={() => navigate('/profile')}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-white">Profile</p>
            <p className="text-xs text-slate-400">View & Edit</p>
          </div>
        </button>
      </div>
    </div>
  )
}

export default PlayerSidebar
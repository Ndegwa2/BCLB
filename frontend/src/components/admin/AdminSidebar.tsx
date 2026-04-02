import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  Users, 
  Gamepad2, 
  Trophy, 
  Wallet,
  Shield,
  ChevronRight
} from 'lucide-react'

interface SidebarItem {
  name: string
  path: string
  icon: React.ElementType
  color: string
}

const AdminSidebar: React.FC = () => {
  const location = useLocation()

  const menuItems: SidebarItem[] = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, color: 'from-purple-500 to-pink-500' },
    { name: 'Users', path: '/admin/users', icon: Users, color: 'from-blue-500 to-cyan-500' },
    { name: 'Games', path: '/admin/games', icon: Gamepad2, color: 'from-emerald-500 to-green-500' },
    { name: 'Tournaments', path: '/admin/tournaments', icon: Trophy, color: 'from-amber-500 to-orange-500' },
    { name: 'Wallet', path: '/admin/wallet', icon: Wallet, color: 'from-pink-500 to-rose-500' },
  ]

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 z-40">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <Link to="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-white block">Admin Panel</span>
            <span className="text-xs text-slate-400">Management Console</span>
          </div>
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
              <motion.div
                key={item.path}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active
                      ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                  {active && (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </Link>
              </motion.div>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-medium text-white">Admin Access</p>
            <p className="text-[10px] text-slate-400">Full privileges</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSidebar
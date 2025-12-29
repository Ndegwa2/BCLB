import React from 'react'
import { Link, useLocation } from 'react-router-dom'

interface SidebarItem {
  name: string
  path: string
  color: string
  icon?: string
}

const AdminSidebar: React.FC = () => {
  const location = useLocation()

  const menuItems: SidebarItem[] = [
    { name: 'Dashboard', path: '/admin', color: '#334155' },
    { name: 'Users', path: '/admin/users', color: '#3b82f6' },
    { name: 'Games', path: '/admin/games', color: '#0ea5e9' },
    { name: 'Tournaments', path: '/admin/tournaments', color: '#a855f7' },
    { name: 'Wallet', path: '/admin/wallet', color: '#f97316' },
  ]

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-slate-800 z-10">
      {/* Header */}
      <div className="p-6">
        <h1 className="text-3xl font-bold text-white">Admin</h1>
      </div>

      {/* Navigation Menu */}
      <nav className="mt-8">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex items-center px-5 py-3 mx-4 rounded-lg transition-colors duration-200 mb-2"
            style={{
              backgroundColor: isActive(item.path) ? item.color : '#334155',
              color: isActive(item.path) ? '#ffffff' : '#e2e8f0',
            }}
            onMouseEnter={(e) => {
              if (!isActive(item.path)) {
                e.currentTarget.style.backgroundColor = '#475569'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive(item.path)) {
                e.currentTarget.style.backgroundColor = '#334155'
              }
            }}
          >
            <span className="text-lg font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}

export default AdminSidebar
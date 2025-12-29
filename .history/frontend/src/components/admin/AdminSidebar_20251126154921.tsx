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
    <div
      className="fixed left-0 top-0 h-full z-10"
      style={{ width: '260px', backgroundColor: '#1e293b' }}
    >
      {/* Header */}
      <div style={{ padding: '40px' }}>
        <h1 className="text-white font-bold" style={{ fontSize: '42px' }}>Admin</h1>
      </div>

      {/* Navigation Menu */}
      <nav style={{ marginTop: '30px' }}>
        {menuItems.map((item, _index) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex items-center rounded-lg transition-colors duration-200 mb-2"
            style={{
              backgroundColor: isActive(item.path) ? item.color : '#334155',
              color: isActive(item.path) ? '#ffffff' : '#e2e8f0',
              marginLeft: '20px',
              marginRight: '20px',
              paddingTop: '12px',
              paddingBottom: '12px',
              paddingLeft: '20px',
              fontSize: '22px',
              fontWeight: '500'
            }}
          >
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}

export default AdminSidebar
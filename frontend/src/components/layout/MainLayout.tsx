import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import AdminSidebar from '../admin/AdminSidebar'
import AdminTopBar from '../admin/AdminTopBar'
import PlayerSidebar from '../player/PlayerSidebar'
import MainTopBar from './MainTopBar'

interface MainLayoutProps {
  children: React.ReactNode
  title?: string
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, title = 'Dashboard' }) => {
  const { state } = useAuth()

  // Determine if user is admin
  const isAdmin = state.user?.is_admin || false

  return (
    <div className="min-h-screen" style={{ backgroundColor: isAdmin ? '#0f172a' : '#0f172a' }}>
      {/* Sidebar - different for admin vs player */}
      {isAdmin ? <AdminSidebar /> : <PlayerSidebar />}

      {/* Top Bar - consistent across all views */}
      {isAdmin ? (
        <AdminTopBar title={title} />
      ) : (
        <MainTopBar title={title} />
      )}

      {/* Main Content Area */}
      <div
        className="main-content-area"
        style={{
          marginLeft: isAdmin ? '260px' : '72px', // 260px for admin sidebar, 72px for player sidebar
          paddingTop: '80px', // Account for top bar height
          minHeight: 'calc(100vh - 80px)'
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default MainLayout
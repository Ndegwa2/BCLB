import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Header } from '../../app/components/Header'

interface MainLayoutProps {
  children: React.ReactNode
  title?: string
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, title = 'Dashboard' }) => {
  const { state } = useAuth()

  // Determine if user is admin
  const isAdmin = state.user?.is_admin || false

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - consistent across all views */}
      <Header balance={state.user?.wallet?.balance || 0} onMenuClick={() => {}} onCreateGame={() => {}} onDeposit={() => {}} />

      {/* Main Content Area */}
      <div
        className="main-content-area"
        style={{
          paddingTop: '80px', // Account for header height
          minHeight: 'calc(100vh - 80px)'
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default MainLayout
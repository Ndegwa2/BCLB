import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Header } from '../../app/components/Header'
import DepositModal from '../wallet/DepositModal'

interface MainLayoutProps {
  children: React.ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { state, logout } = useAuth()
  const navigate = useNavigate()
  const [showDepositModal, setShowDepositModal] = useState(false)

  // Determine if user is admin
  const isAdmin = state.user?.is_admin || false

  const handleDeposit = () => setShowDepositModal(true)
  const handleProfile = () => navigate('/profile')
  const handleLogout = () => logout()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - consistent across all views */}
      <Header
        balance={state.user?.wallet?.balance || 0}
        onMenuClick={() => {}}
        onCreateGame={() => {}}
        onDeposit={handleDeposit}
        onProfile={handleProfile}
        onLogout={handleLogout}
      />

      {/* Deposit Modal */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onSuccess={() => setShowDepositModal(false)}
        availableBalance={state.user?.wallet?.balance || 0}
      />

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
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { WalletProvider } from './contexts/WalletContext'
import { GameProvider } from './contexts/GameContext'
import { NotificationProvider } from './contexts/NotificationContext'
import MainLayout from './components/layout/MainLayout'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Games from './pages/Games'
import GamePlay from './pages/GamePlay'
import Tournaments from './pages/Tournaments'
import Wallet from './pages/Wallet'
import Profile from './pages/Profile'
import AdminDashboard from './pages/AdminDashboard'
import NotFound from './pages/NotFound'

// Components
import AuthGuard from './components/auth/AuthGuard'
import { LoadingSpinner } from './components/ui/LoadingSpinner'
import ErrorBoundary from './components/ErrorBoundary'

// Hooks
import { useAuth } from './contexts/AuthContext'

// Styles
import './styles/globals.css'



const LayoutWrapper: React.FC<{ children: React.ReactNode, title?: string }> = ({ children, title }) => {
  return (
    <MainLayout title={title}>
      {children}
    </MainLayout>
  )
}

const AppContent: React.FC = () => {
  const { state } = useAuth()

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={!state.isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!state.isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />

      {/* Protected routes with layout */}
      <Route path="/dashboard" element={
        <AuthGuard>
          <LayoutWrapper title="Dashboard">
            {state.user?.is_admin ? <AdminDashboard /> : <Dashboard />}
          </LayoutWrapper>
        </AuthGuard>
      } />

      <Route path="/games" element={
        <AuthGuard>
          <LayoutWrapper title="Games">
            <Games />
          </LayoutWrapper>
        </AuthGuard>
      } />

      <Route path="/games/play/:gameId" element={
        <AuthGuard>
          <LayoutWrapper title="Game Play">
            <GamePlay />
          </LayoutWrapper>
        </AuthGuard>
      } />

      <Route path="/tournaments" element={
        <AuthGuard>
          <LayoutWrapper title="Tournaments">
            <Tournaments />
          </LayoutWrapper>
        </AuthGuard>
      } />

      <Route path="/wallet" element={
        <AuthGuard>
          <LayoutWrapper title="Wallet">
            <Wallet />
          </LayoutWrapper>
        </AuthGuard>
      } />

      <Route path="/profile" element={
        <AuthGuard>
          <LayoutWrapper title="Profile">
            <Profile />
          </LayoutWrapper>
        </AuthGuard>
      } />

      {/* Admin Routes - redirect to dashboard for admin users */}
      <Route path="/admin" element={
        <AuthGuard requireAdmin={true}>
          <LayoutWrapper title="Admin Dashboard">
            <AdminDashboard />
          </LayoutWrapper>
        </AuthGuard>
      } />
      <Route path="/admin/users" element={
        <AuthGuard requireAdmin={true}>
          <LayoutWrapper title="Users Management">
            <AdminDashboard />
          </LayoutWrapper>
        </AuthGuard>
      } />
      <Route path="/admin/games" element={
        <AuthGuard requireAdmin={true}>
          <LayoutWrapper title="Games Management">
            <AdminDashboard />
          </LayoutWrapper>
        </AuthGuard>
      } />
      <Route path="/admin/tournaments" element={
        <AuthGuard requireAdmin={true}>
          <LayoutWrapper title="Tournaments Management">
            <AdminDashboard />
          </LayoutWrapper>
        </AuthGuard>
      } />
      <Route path="/admin/wallet" element={
        <AuthGuard requireAdmin={true}>
          <LayoutWrapper title="Wallet Management">
            <AdminDashboard />
          </LayoutWrapper>
        </AuthGuard>
      } />

      {/* Redirect root to appropriate page */}
      <Route path="/" element={
        <Navigate to={state.isAuthenticated ? "/dashboard" : "/login"} />
      } />

      {/* 404 page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true,
                }}
              >
                <AuthProvider>
                  <WalletProvider>
                    <GameProvider>
                      <NotificationProvider>
                        <div className="App">
                          <AppContent />
                        </div>
                      </NotificationProvider>
                    </GameProvider>
                  </WalletProvider>
                </AuthProvider>
              </Router>
    </ErrorBoundary>
  )
}

export default App
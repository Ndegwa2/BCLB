import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { WalletProvider } from './contexts/WalletContext'
import { GameProvider } from './contexts/GameContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { Toaster } from 'sonner'
import MainLayout from './components/layout/MainLayout'

// Pages
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import Games from './pages/Games'
import GamePlay from './pages/GamePlay'
import PlayVsAI from './pages/PlayVsAI'
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



const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <MainLayout>
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
    <>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={!state.isAuthenticated ? <AuthPage /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!state.isAuthenticated ? <AuthPage /> : <Navigate to="/dashboard" />} />

      {/* Protected routes with layout */}
      <Route path="/dashboard" element={
        <AuthGuard>
          <LayoutWrapper>
            {state.user?.is_admin ? <AdminDashboard /> : <Dashboard />}
          </LayoutWrapper>
        </AuthGuard>
      } />

      <Route path="/games" element={
        <AuthGuard>
          <LayoutWrapper>
            <Games />
          </LayoutWrapper>
        </AuthGuard>
      } />

      <Route path="/games/play/:gameId" element={
        <AuthGuard>
          <LayoutWrapper>
            <GamePlay />
          </LayoutWrapper>
        </AuthGuard>
      } />

      <Route path="/tournaments" element={
        <AuthGuard>
          <LayoutWrapper>
            <Tournaments />
          </LayoutWrapper>
        </AuthGuard>
      } />

      <Route path="/wallet" element={
        <AuthGuard>
          <LayoutWrapper>
            <Wallet />
          </LayoutWrapper>
        </AuthGuard>
      } />

      <Route path="/profile" element={
        <AuthGuard>
          <LayoutWrapper>
            <Profile />
          </LayoutWrapper>
        </AuthGuard>
      } />

      {/* Admin Routes - redirect to dashboard for admin users */}
      <Route path="/admin" element={
        <AuthGuard requireAdmin={true}>
          <LayoutWrapper>
            <AdminDashboard />
          </LayoutWrapper>
        </AuthGuard>
      } />
      <Route path="/admin/users" element={
        <AuthGuard requireAdmin={true}>
          <LayoutWrapper>
            <AdminDashboard />
          </LayoutWrapper>
        </AuthGuard>
      } />
      <Route path="/admin/games" element={
        <AuthGuard requireAdmin={true}>
          <LayoutWrapper>
            <AdminDashboard />
          </LayoutWrapper>
        </AuthGuard>
      } />
      <Route path="/admin/tournaments" element={
        <AuthGuard requireAdmin={true}>
          <LayoutWrapper>
            <AdminDashboard />
          </LayoutWrapper>
        </AuthGuard>
      } />
      <Route path="/admin/wallet" element={
        <AuthGuard requireAdmin={true}>
          <LayoutWrapper>
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
    </>
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
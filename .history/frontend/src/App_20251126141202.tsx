import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { WalletProvider } from './contexts/WalletContext'
import { GameProvider } from './contexts/GameContext'
import { NotificationProvider } from './contexts/NotificationContext'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Games from './pages/Games'
import GamePlay from './pages/GamePlay'
import Tournaments from './pages/Tournaments'
import Wallet from './pages/Wallet'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'

// Components
import AuthGuard from './components/auth/AuthGuard'
import { LoadingSpinner } from './components/ui/LoadingSpinner'
import ErrorBoundary from './components/ErrorBoundary'

// Hooks
import { useAuth } from './contexts/AuthContext'

// Styles
import './styles/globals.css'

// Suppress React Router v7 deprecation warnings
if (typeof window !== 'undefined') {
  (window as any).__remixRouteModules = new Map()
  ;(window as any).__remixContext = { routeModules: (window as any).__remixRouteModules }
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
      
      {/* Protected routes */}
      <Route path="/dashboard" element={
        <AuthGuard>
          <Dashboard />
        </AuthGuard>
      } />
      
      <Route path="/games" element={
        <AuthGuard>
          <Games />
        </AuthGuard>
      } />
      
      <Route path="/games/play/:gameId" element={
        <AuthGuard>
          <GamePlay />
        </AuthGuard>
      } />
      
      <Route path="/tournaments" element={
        <AuthGuard>
          <Tournaments />
        </AuthGuard>
      } />
      
      <Route path="/wallet" element={
        <AuthGuard>
          <Wallet />
        </AuthGuard>
      } />
      
      <Route path="/profile" element={
        <AuthGuard>
          <Profile />
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
      <Router>
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
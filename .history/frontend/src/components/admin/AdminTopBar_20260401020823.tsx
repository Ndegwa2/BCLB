import React from 'react'
import { useAuth } from '../../contexts/AuthContext'

interface AdminTopBarProps {
  title: string
}

const AdminTopBar: React.FC<AdminTopBarProps> = ({ title }) => {
  const { logout } = useAuth()

  return (
    <div
      className="fixed top-0 z-20 flex items-center"
      style={{
        left: '260px',
        right: '0px',
        height: '80px',
        backgroundColor: '#1e293b',
        paddingLeft: '40px'
      }}
    >
      <h1
        className="text-white font-bold"
        style={{ fontSize: '32px' }}
      >
        {title}
      </h1>

      {/* User Profile Icon */}
      <div
        className="rounded-full flex items-center justify-center"
        style={{
          position: 'absolute',
          right: '40px',
          width: '56px',
          height: '56px',
          backgroundColor: '#3b82f6'
        }}
      >
        <span style={{ fontSize: '20px', color: 'white' }}>👤</span>
      </div>

      {/* Logout Button */}
      <button
        onClick={logout}
        className="absolute right-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
        </svg>
        Logout
      </button>
    </div>
  )
}

export default AdminTopBar
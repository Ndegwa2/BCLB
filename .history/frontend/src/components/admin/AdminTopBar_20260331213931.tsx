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
        className="absolute right-0 top-0 mt-80 mr-20 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors duration-200"
      >
        Logout
      </button>
    </div>
  )
}

export default AdminTopBar
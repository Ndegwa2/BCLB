import React from 'react'

interface AdminTopBarProps {
  title: string
}

const AdminTopBar: React.FC<AdminTopBarProps> = ({ title }) => {
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
    </div>
  )
}

export default AdminTopBar
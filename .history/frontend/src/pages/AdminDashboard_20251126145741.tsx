import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import AdminSidebar from '../components/admin/AdminSidebar'
import AdminTopBar from '../components/admin/AdminTopBar'
import OverviewCards, { defaultMetrics } from '../components/admin/OverviewCards'
import UsersTable from '../components/admin/UsersTable'

const AdminDashboard: React.FC = () => {
  const { state } = useAuth()

  // Check if user is admin
  if (!state.user?.is_admin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300">You don't have permission to access this area.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0f172a' }}>
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Top Bar */}
      <AdminTopBar title="Admin Dashboard" />
      
      {/* Main Content */}
      <div className="pt-20" style={{ marginLeft: '260px' }}>
        {/* Overview Cards Row */}
        <div className="flex space-x-6 p-8" style={{ paddingLeft: '40px', paddingRight: '40px' }}>
          <OverviewCards metrics={defaultMetrics} />
        </div>
        
        {/* Users Table */}
        <div style={{ paddingLeft: '40px', paddingRight: '40px', paddingBottom: '40px' }}>
          <UsersTable />
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
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
    <div className="min-h-screen bg-slate-900">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Top Bar */}
      <AdminTopBar title="Admin Dashboard" />
      
      {/* Main Content */}
      <div className="ml-64 pt-20 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Overview Cards */}
          <OverviewCards metrics={defaultMetrics} />
          
          {/* Users Table */}
          <UsersTable />
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
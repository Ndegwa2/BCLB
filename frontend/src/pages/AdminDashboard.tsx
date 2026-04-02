import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import AdminSidebar from '../components/admin/AdminSidebar'
import AdminTopBar from '../components/admin/AdminTopBar'
import OverviewCards from '../components/admin/OverviewCards'
import UsersTable from '../components/admin/UsersTable'

const AdminDashboard: React.FC = () => {
  const { state } = useAuth()

  // Check if user is admin
  if (!state.user?.is_admin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400">You don't have permission to access this area.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Top Bar */}
      <AdminTopBar title="Admin Dashboard" />

      {/* Main Content */}
      <div className="ml-64 pt-24 p-8">
        <div className="space-y-8">
          {/* Overview Cards */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Platform Overview</h2>
            <OverviewCards />
          </section>

          {/* Users Table */}
          <section>
            <UsersTable />
          </section>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
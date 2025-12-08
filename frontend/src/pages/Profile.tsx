import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiClient } from '../services/api'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

interface UserProfile {
  id: number
  username: string
  email: string | null
  phone_number: string
  is_admin: boolean
  created_at: string
  updated_at: string
}

const Profile: React.FC = () => {
  const { state: authState, logout } = useAuth()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone_number: ''
  })
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [operationStatus, setOperationStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  // Fetch user profile
  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.get('/auth/me')
      setUser(response.data.user)
      setFormData({
        username: response.data.user.username,
        email: response.data.user.email || '',
        phone_number: response.data.user.phone_number
      })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch profile')
      console.error('Profile fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authState.isAuthenticated) {
      fetchProfile()
    }
  }, [authState.isAuthenticated])

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle password input changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Update profile
  const handleUpdateProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      // Prepare data for update (only send fields that changed)
      const updateData: any = {}
      if (formData.username !== user?.username) {
        updateData.username = formData.username
      }
      if (formData.email !== user?.email) {
        updateData.email = formData.email || null
      }
      if (formData.phone_number !== user?.phone_number) {
        updateData.phone_number = formData.phone_number
      }

      if (Object.keys(updateData).length === 0) {
        setOperationStatus({ type: 'error', message: 'No changes detected' })
        return
      }

      const response = await apiClient.patch('/auth/profile', updateData)

      setOperationStatus({ type: 'success', message: 'Profile updated successfully' })
      setEditMode(false)
      await fetchProfile() // Refresh profile data
    } catch (err: any) {
      setOperationStatus({
        type: 'error',
        message: err.response?.data?.error || 'Failed to update profile'
      })
      console.error('Profile update error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Change password
  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      setOperationStatus({ type: 'error', message: 'New passwords do not match' })
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.post('/auth/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      })

      setOperationStatus({ type: 'success', message: 'Password changed successfully' })
      setShowPasswordModal(false)
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
    } catch (err: any) {
      setOperationStatus({
        type: 'error',
        message: err.response?.data?.error || 'Failed to change password'
      })
      console.error('Password change error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  // Calculate account age
  const getAccountAge = (createdAt: string) => {
    const createdDate = new Date(createdAt)
    const now = new Date()
    const diffInMs = now.getTime() - createdDate.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays < 30) {
      return `${diffInDays} days`
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30)
      return `${months} months`
    } else {
      const years = Math.floor(diffInDays / 365)
      return `${years} years`
    }
  }

  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please login to view your profile</h2>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Profile</h1>

          {/* Operation Status Alert */}
          {operationStatus.type && (
            <div className={`mb-6 p-4 rounded-md ${
              operationStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {operationStatus.message}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-md">
              {error}
              <button
                onClick={fetchProfile}
                className="ml-4 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : user ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Information */}
              <div className="lg:col-span-2">
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                    {editMode ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditMode(false)
                            setFormData({
                              username: user.username,
                              email: user.email || '',
                              phone_number: user.phone_number
                            })
                          }}
                          className="px-3 py-1 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleUpdateProfile}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                        >
                          Save Changes
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditMode(true)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <label className="text-sm font-medium text-gray-600">Username</label>
                      {editMode ? (
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          minLength={3}
                          maxLength={50}
                          required
                        />
                      ) : (
                        <div className="md:col-span-2 text-gray-900">{user.username}</div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      {editMode ? (
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="md:col-span-2 text-gray-900">
                          {user.email || <span className="text-gray-400">Not set</span>}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <label className="text-sm font-medium text-gray-600">Phone Number</label>
                      {editMode ? (
                        <input
                          type="tel"
                          name="phone_number"
                          value={formData.phone_number}
                          onChange={handleInputChange}
                          className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      ) : (
                        <div className="md:col-span-2 text-gray-900">{user.phone_number}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Account Security */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Account Security</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <div>
                        <div className="text-sm font-medium text-gray-600">Password</div>
                        <div className="text-sm text-gray-500">Last changed: Never</div>
                      </div>
                      <button
                        onClick={() => setShowPasswordModal(true)}
                        className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                      >
                        Change Password
                      </button>
                    </div>

                    <div className="flex justify-between items-center py-3">
                      <div>
                        <div className="text-sm font-medium text-gray-600">Two-Factor Authentication</div>
                        <div className="text-sm text-gray-500">Add extra security to your account</div>
                      </div>
                      <button
                        disabled
                        className="px-3 py-1 bg-gray-300 text-gray-500 rounded text-sm cursor-not-allowed"
                      >
                        Coming Soon
                      </button>
                    </div>
                  </div>
                </div>

                {/* Account Actions */}
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Account Actions</h2>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={fetchProfile}
                      className="w-full flex justify-between items-center px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-md text-left"
                    >
                      <span>Refresh Profile Data</span>
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>

                    <button
                      onClick={logout}
                      className="w-full flex justify-between items-center px-4 py-3 bg-red-100 hover:bg-red-200 rounded-md text-left"
                    >
                      <span className="text-red-600 font-medium">Logout</span>
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Account Summary */}
              <div className="space-y-6">
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Summary</h3>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Account ID</span>
                      <span className="text-sm font-medium text-gray-900">{user.id}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Member Since</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(user.created_at)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Account Age</span>
                      <span className="text-sm font-medium text-gray-900">
                        {getAccountAge(user.created_at)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Last Updated</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(user.updated_at)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Account Type</span>
                      <span className="text-sm font-medium text-gray-900">
                        {user.is_admin ? 'Administrator' : 'Player'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>

                  <div className="space-y-3">
                    <a
                      href="/wallet"
                      className="block w-full flex justify-between items-center px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-md text-left"
                    >
                      <span>View Wallet</span>
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </a>

                    <a
                      href="/games"
                      className="block w-full flex justify-between items-center px-3 py-2 bg-green-50 hover:bg-green-100 rounded-md text-left"
                    >
                      <span>Play Games</span>
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                      </svg>
                    </a>

                    <a
                      href="/tournaments"
                      className="block w-full flex justify-between items-center px-3 py-2 bg-purple-50 hover:bg-purple-100 rounded-md text-left"
                    >
                      <span>Join Tournaments</span>
                      <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              User profile not found. Please try refreshing the page.
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setPasswordData({
                    current_password: '',
                    new_password: '',
                    confirm_password: ''
                  })
                  setOperationStatus({ type: null, message: '' })
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  id="current_password"
                  name="current_password"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Enter current password"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  id="new_password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Enter new password"
                  required
                  minLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters long</p>
              </div>

              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirm_password"
                  name="confirm_password"
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Confirm new password"
                  required
                  minLength={8}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowPasswordModal(false)
                    setPasswordData({
                      current_password: '',
                      new_password: '',
                      confirm_password: ''
                    })
                    setOperationStatus({ type: null, message: '' })
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
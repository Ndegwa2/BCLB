import React from 'react'

const Profile: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Profile</h1>
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-600">Manage your profile and account settings.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
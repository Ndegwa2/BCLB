import React, { useState } from 'react'

interface User {
  id: number
  name: string
  email: string
  status: 'Active' | 'Blocked' | 'Pending'
  registrationDate: string
  lastActive: string
}

interface UsersTableProps {
  users?: User[]
}

const UsersTable: React.FC<UsersTableProps> = ({ users = [] }) => {
  const [usersData] = useState<User[]>(users.length > 0 ? users : [
    {
      id: 1,
      name: 'Jane Doe',
      email: 'jane@example.com',
      status: 'Active',
      registrationDate: '2024-01-15',
      lastActive: '2024-11-26',
    },
    {
      id: 2,
      name: 'John Smith',
      email: 'john@example.com',
      status: 'Blocked',
      registrationDate: '2024-02-10',
      lastActive: '2024-11-20',
    },
    {
      id: 3,
      name: 'Samuel Ndegwa',
      email: 'samuel@example.com',
      status: 'Active',
      registrationDate: '2024-03-05',
      lastActive: '2024-11-26',
    },
    {
      id: 4,
      name: 'Alice Johnson',
      email: 'alice@example.com',
      status: 'Pending',
      registrationDate: '2024-11-20',
      lastActive: '2024-11-20',
    },
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'text-green-600 bg-green-100'
      case 'Blocked':
        return 'text-red-600 bg-red-100'
      case 'Pending':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const handleStatusChange = (userId: number, newStatus: 'Active' | 'Blocked') => {
    console.log(`Changing user ${userId} status to ${newStatus}`)
    // Here you would typically make an API call to update the user status
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-800">Users</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Add New User
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Email</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Registration Date</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Last Active</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {usersData.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="font-medium text-slate-800">{user.name}</div>
                  <div className="text-sm text-gray-500">ID: {user.id}</div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-slate-600">{user.email}</div>
                </td>
                <td className="py-4 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                    {user.status}
                  </span>
                </td>
                <td className="py-4 px-4 text-slate-600">
                  {new Date(user.registrationDate).toLocaleDateString()}
                </td>
                <td className="py-4 px-4 text-slate-600">
                  {new Date(user.lastActive).toLocaleDateString()}
                </td>
                <td className="py-4 px-4">
                  <div className="flex space-x-2">
                    {user.status === 'Blocked' ? (
                      <button
                        onClick={() => handleStatusChange(user.id, 'Active')}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                      >
                        Activate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(user.id, 'Blocked')}
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                      >
                        Block
                      </button>
                    )}
                    <button className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700">
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {usersData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No users found.
        </div>
      )}
    </div>
  )
}

export default UsersTable
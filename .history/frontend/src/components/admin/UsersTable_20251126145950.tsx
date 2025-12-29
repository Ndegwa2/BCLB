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
  ])

  return (
    <div
      className="rounded-2xl"
      style={{
        backgroundColor: '#ffffff',
        width: '1000px',
        height: '600px'
      }}
    >
      <div style={{ padding: '50px' }}>
        <h2
          className="font-semibold"
          style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '50px'
          }}
        >
          Users
        </h2>

        {/* Table Headings */}
        <div
          className="font-bold"
          style={{
            marginBottom: '50px',
            color: '#334155',
            fontSize: '18px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Name</span>
            <span style={{ marginRight: '200px' }}>Email</span>
            <span>Status</span>
          </div>
        </div>

        {/* Table Rows */}
        <div>
          {usersData.map((user, index) => (
            <div
              key={user.id}
              className="font-medium"
              style={{
                color: '#334155',
                fontSize: '18px',
                marginBottom: index < usersData.length - 1 ? '50px' : '0',
                display: 'flex',
                justifyContent: 'space-between'
              }}
            >
              <span>{user.name}</span>
              <span style={{ marginRight: '200px' }}>{user.email}</span>
              <span>{user.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default UsersTable
import React, { createContext, useContext, ReactNode } from 'react'

interface NotificationContextType {
  notifications: any[]
  addNotification: (notification: any) => void
  removeNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const value = {
    notifications: [],
    addNotification: (notification: any) => {},
    removeNotification: (id: string) => {}
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
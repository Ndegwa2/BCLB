import React from 'react'

interface DashboardCardProps {
  title: string
  value: string | number
  className?: string
  gradient?: 'blue' | 'green' | 'default'
}

const DashboardCard: React.FC<DashboardCardProps> = ({ 
  title, 
  value, 
  className = '', 
  gradient = 'default' 
}) => {
  const gradientClasses = {
    blue: 'bg-gradient-to-r from-blue-800 to-blue-900',
    green: 'bg-gradient-to-r from-emerald-700 to-emerald-800',
    default: 'bg-slate-800'
  }

  return (
    <div className={`rounded-xl p-6 shadow-xl ${gradientClasses[gradient]} ${className}`}>
      <h3 className="text-slate-300 text-lg font-semibold mb-4">{title}</h3>
      <p className="text-white text-4xl font-bold">{value}</p>
    </div>
  )
}

export default DashboardCard
import React from 'react'

interface MetricCard {
  title: string
  label: string
  value: string
  color: string
  textColor: string
}

interface OverviewCardsProps {
  metrics: MetricCard[]
}

const OverviewCards: React.FC<OverviewCardsProps> = ({ metrics }) => {
  return (
    <div className="flex space-x-6 mb-8">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="w-80 h-40 rounded-2xl p-6"
          style={{ backgroundColor: metric.color }}
        >
          <h3 className="text-xl font-semibold mb-4" style={{ color: metric.textColor }}>
            {metric.title}
          </h3>
          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: metric.textColor }}>
              {metric.label}
            </p>
            <p className="text-2xl font-bold" style={{ color: metric.textColor }}>
              {metric.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default OverviewCards

// Default metrics for demo
export const defaultMetrics: MetricCard[] = [
  {
    title: 'Users',
    label: 'Total Users',
    value: '14,502',
    color: '#3b82f6',
    textColor: '#ffffff',
  },
  {
    title: 'Games',
    label: 'Active Games',
    value: '42',
    color: '#0ea5e9',
    textColor: '#ffffff',
  },
  {
    title: 'Tournaments',
    label: 'Live Events',
    value: '6 Running',
    color: '#a855f7',
    textColor: '#ffffff',
  },
]
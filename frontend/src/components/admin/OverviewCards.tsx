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
    <>
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="rounded-2xl p-6"
          style={{
            backgroundColor: metric.color,
            width: '300px',
            height: '160px',
            marginRight: index < metrics.length - 1 ? '40px' : '0'
          }}
        >
          <h3
            className="font-semibold mb-4"
            style={{
              color: metric.textColor,
              fontSize: '26px',
              fontWeight: '600'
            }}
          >
            {metric.title}
          </h3>
          <div className="space-y-2">
            <p
              className="font-medium"
              style={{
                color: metric.textColor,
                fontSize: '20px',
                fontWeight: '600'
              }}
            >
              {metric.label}
            </p>
            <p
              className="font-bold"
              style={{
                color: metric.textColor,
                fontSize: '18px'
              }}
            >
              {metric.value}
            </p>
          </div>
        </div>
      ))}
    </>
  )
}

export { OverviewCards as default }
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
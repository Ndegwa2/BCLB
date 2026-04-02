import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface DashboardCardProps {
  title: string
  value: string | number
  subtitle?: string
  className?: string
  gradient?: 'blue' | 'green' | 'purple' | 'orange' | 'pink'
  icon?: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
}

const DashboardCard: React.FC<DashboardCardProps> = ({ 
  title, 
  value, 
  subtitle,
  className = '', 
  gradient = 'blue',
  icon: Icon,
  trend
}) => {
  const gradientClasses = {
    blue: 'from-blue-600 to-cyan-600',
    green: 'from-emerald-600 to-green-600',
    purple: 'from-purple-600 to-pink-600',
    orange: 'from-orange-500 to-amber-500',
    pink: 'from-pink-500 to-rose-500'
  }

  const glowColors = {
    blue: 'rgba(37, 99, 235, 0.3)',
    green: 'rgba(16, 185, 129, 0.3)',
    purple: 'rgba(147, 51, 234, 0.3)',
    orange: 'rgba(249, 115, 22, 0.3)',
    pink: 'rgba(236, 72, 153, 0.3)'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientClasses[gradient]} p-6 shadow-xl ${className}`}
      style={{ boxShadow: `0 8px 32px ${glowColors[gradient]}` }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20" />
        <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-white/10" />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-white/80">{title}</p>
            <p className="text-3xl font-bold text-white">{value}</p>
            {subtitle && (
              <p className="text-xs text-white/60">{subtitle}</p>
            )}
            {trend && (
              <div className={`flex items-center gap-1 text-xs ${trend.isPositive ? 'text-green-200' : 'text-red-200'}`}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={trend.isPositive ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                </svg>
                <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Icon className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export { DashboardCard as default, DashboardCard }
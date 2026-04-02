import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Gamepad2, 
  Trophy, 
  DollarSign, 
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { usersService } from '../../services/users'

interface OverviewData {
  total_deposits: number
  total_withdrawals: number
  house_commission: number
  active_games: number
  total_users: number
  total_tournaments: number
  total_payments: number
  successful_payments: number
  payment_success_rate: number
}

interface RecentActivity {
  games_created_24h: number
  users_registered_24h: number
  deposits_24h: number
}

interface MetricCard {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: React.ElementType
  gradient: string
  glowColor: string
}

const OverviewCards: React.FC = () => {
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOverview()
  }, [])

  const fetchOverview = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await usersService.getOverview()
      setOverview(response.overview)
      setRecentActivity(response.recent_activity)
    } catch (err) {
      setError('Failed to fetch overview data')
      console.error('Error fetching overview:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-6 animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div className="h-4 bg-slate-700 rounded w-20" />
              <div className="w-10 h-10 rounded-xl bg-slate-700" />
            </div>
            <div className="h-8 bg-slate-700 rounded w-24 mb-2" />
            <div className="h-3 bg-slate-700 rounded w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-red-400">{error}</p>
        <button onClick={fetchOverview} className="mt-2 text-purple-400 hover:text-purple-300 text-sm">
          Retry
        </button>
      </div>
    )
  }

  const cards: MetricCard[] = [
    {
      title: 'Total Users',
      value: overview?.total_users.toLocaleString() || '0',
      change: recentActivity ? `+${recentActivity.users_registered_24h} today` : undefined,
      changeType: 'positive',
      icon: Users,
      gradient: 'from-blue-600 to-cyan-600',
      glowColor: 'rgba(37, 99, 235, 0.3)'
    },
    {
      title: 'Active Games',
      value: overview?.active_games || '0',
      change: recentActivity ? `+${recentActivity.games_created_24h} today` : undefined,
      changeType: 'positive',
      icon: Gamepad2,
      gradient: 'from-purple-600 to-pink-600',
      glowColor: 'rgba(147, 51, 234, 0.3)'
    },
    {
      title: 'Tournaments',
      value: overview?.total_tournaments || '0',
      change: 'Total events',
      changeType: 'neutral',
      icon: Trophy,
      gradient: 'from-amber-500 to-orange-500',
      glowColor: 'rgba(245, 158, 11, 0.3)'
    },
    {
      title: 'House Commission',
      value: `$${(overview?.house_commission || 0).toFixed(2)}`,
      change: `${overview?.payment_success_rate || 0}% success rate`,
      changeType: 'positive',
      icon: DollarSign,
      gradient: 'from-green-600 to-emerald-600',
      glowColor: 'rgba(16, 185, 129, 0.3)'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="glass-card p-6 relative overflow-hidden"
              style={{ boxShadow: `0 8px 32px ${card.glowColor}` }}
            >
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${card.gradient}`} />
              </div>

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <p className="text-sm font-medium text-slate-400">{card.title}</p>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white mb-2">{card.value}</p>
                {card.change && (
                  <div className={`flex items-center gap-1 text-xs ${
                    card.changeType === 'positive' ? 'text-green-400' : 
                    card.changeType === 'negative' ? 'text-red-400' : 
                    'text-slate-400'
                  }`}>
                    {card.changeType === 'positive' ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : card.changeType === 'negative' ? (
                      <ArrowDownRight className="w-3 h-3" />
                    ) : (
                      <Activity className="w-3 h-3" />
                    )}
                    <span>{card.change}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Deposits</p>
              <p className="text-xl font-bold text-white">${(overview?.total_deposits || 0).toFixed(2)}</p>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            24h: ${(recentActivity?.deposits_24h || 0).toFixed(2)}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Withdrawals</p>
              <p className="text-xl font-bold text-white">${(overview?.total_withdrawals || 0).toFixed(2)}</p>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Net: ${((overview?.total_deposits || 0) - (overview?.total_withdrawals || 0)).toFixed(2)}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Payment Success</p>
              <p className="text-xl font-bold text-white">{overview?.payment_success_rate || 0}%</p>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            {overview?.successful_payments || 0} / {overview?.total_payments || 0} payments
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export { OverviewCards as default, OverviewCards }
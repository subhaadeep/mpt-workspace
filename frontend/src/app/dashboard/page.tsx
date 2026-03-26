'use client'

import { useAuthStore } from '@/store/authStore'
import { useQuery } from '@tanstack/react-query'
import { Bot, Youtube, Shield, Activity, Users, Clock, TrendingUp, ArrowRight, Bell } from 'lucide-react'
import Link from 'next/link'
import DashboardShell from '@/components/layout/DashboardShell'
import api from '@/lib/api'

export default function DashboardHome() {
  const user = useAuthStore(s => s.user)

  const { data: bots = [] } = useQuery({
    queryKey: ['bots'],
    queryFn: () => api.get('/api/bots').then(r => r.data),
    enabled: !!(user?.is_admin || user?.can_access_bots),
  })

  const { data: videos = [] } = useQuery({
    queryKey: ['youtube-videos'],
    queryFn: () => api.get('/api/youtube/videos').then(r => r.data),
    enabled: !!(user?.is_admin || user?.can_access_youtube),
  })

  const { data: members = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/api/admin/users').then(r => r.data),
    enabled: !!user?.is_admin,
  })

  const { data: requests = [] } = useQuery({
    queryKey: ['access-requests'],
    queryFn: () => api.get('/api/admin/access-requests').then(r => r.data),
    enabled: !!user?.is_admin,
  })

  const pendingRequests = (requests as { status: string }[]).filter((r) => r.status === 'pending')
  const activeBots = (bots as { is_active?: boolean }[]).filter((b) => b.is_active !== false)

  const moduleCards = [
    {
      href: '/dashboard/bots',
      icon: Bot,
      label: 'Trading Bots',
      desc: 'Strategy versions, code & performance',
      color: 'from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:border-blue-400/40',
      iconBg: 'bg-blue-500/15',
      iconColor: 'text-blue-400',
      stat: activeBots.length,
      statLabel: 'active',
      show: user?.is_admin || user?.can_access_bots,
    },
    {
      href: '/dashboard/youtube',
      icon: Youtube,
      label: 'YouTube',
      desc: 'Video ideas, scripts & content pipeline',
      color: 'from-red-500/10 to-red-600/5 border-red-500/20 hover:border-red-400/40',
      iconBg: 'bg-red-500/15',
      iconColor: 'text-red-400',
      stat: (videos as unknown[]).length,
      statLabel: 'videos',
      show: user?.is_admin || user?.can_access_youtube,
    },
    {
      href: '/dashboard/admin',
      icon: Shield,
      label: 'Admin Panel',
      desc: 'Manage users, access requests & permissions',
      color: 'from-violet-500/10 to-violet-600/5 border-violet-500/20 hover:border-violet-400/40',
      iconBg: 'bg-violet-500/15',
      iconColor: 'text-violet-400',
      stat: pendingRequests.length,
      statLabel: 'pending',
      show: user?.is_admin,
    },
  ].filter(c => c.show)

  return (
    <DashboardShell title="Dashboard">
      <div className="space-y-6 max-w-5xl">

        {/* Greeting */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Hello, {user?.full_name?.split(' ')[0] || user?.username || 'there'} 👋
            </h2>
            <p className="text-slate-500 mt-1 text-sm">Here&apos;s your workspace overview.</p>
          </div>
          {pendingRequests.length > 0 && (
            <Link href="/dashboard/admin"
              className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-400 hover:bg-amber-500/20 transition-all">
              <Bell className="h-4 w-4" />
              {pendingRequests.length} pending request{pendingRequests.length > 1 ? 's' : ''}
            </Link>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Active Bots',     value: activeBots.length,         icon: Bot,        color: 'text-blue-400',   show: user?.is_admin || user?.can_access_bots },
            { label: 'YouTube Videos',  value: (videos as unknown[]).length, icon: Youtube,    color: 'text-red-400',    show: user?.is_admin || user?.can_access_youtube },
            { label: 'Team Members',    value: (members as unknown[]).length, icon: Users,      color: 'text-violet-400', show: user?.is_admin },
            { label: 'Pending Access',  value: pendingRequests.length,    icon: Clock,      color: 'text-amber-400',  show: user?.is_admin },
          ].filter(s => s.show).map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i} className="rounded-2xl border border-white/5 bg-white/2 px-4 py-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`h-4 w-4 ${s.color}`} />
                  <TrendingUp className="h-3 w-3 text-slate-700" />
                </div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            )
          })}
        </div>

        {/* Module Cards */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-3">Modules</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {moduleCards.map(c => {
              const Icon = c.icon
              return (
                <Link key={c.href} href={c.href}
                  className={`group rounded-2xl border bg-gradient-to-br ${c.color} p-5 transition-all duration-200 hover:shadow-2xl hover:-translate-y-0.5`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${c.iconBg} ${c.iconColor}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </div>
                  <p className="font-semibold text-white mb-1">{c.label}</p>
                  <p className="text-xs text-slate-500 mb-3">{c.desc}</p>
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-400">{c.stat}</span> {c.statLabel}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Recent Activity placeholder */}
        <div className="rounded-2xl border border-white/5 bg-white/2 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-medium text-slate-400">Recent Activity</h3>
          </div>
          <p className="text-sm text-slate-600 text-center py-4">Activity feed coming soon...</p>
        </div>

      </div>
    </DashboardShell>
  )
}

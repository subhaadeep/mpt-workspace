'use client'

import { useAuthStore } from '@/store/authStore'
import { useQuery } from '@tanstack/react-query'
import { Bot, Youtube, Shield, Users, Clock, TrendingUp, ArrowRight, Bell, Activity, Film, Scissors, Image, Upload, FileText, Archive, ChevronRight, Trash2 } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'

type ActivityLog = {
  id: number
  video_title: string
  action: string
  from_status?: string
  to_status?: string
  done_by_name?: string
  created_at: string
}

const STATUS_ICON: Record<string, React.ElementType> = {
  script: FileText, raw_files: Film, editing: Scissors,
  thumbnail: Image, queue: Archive, uploaded: Upload,
}
const STATUS_COLOR: Record<string, string> = {
  script: 'text-violet-400', raw_files: 'text-blue-400', editing: 'text-amber-400',
  thumbnail: 'text-pink-400', queue: 'text-cyan-400', uploaded: 'text-emerald-400',
}
const ACTION_COLOR: Record<string, string> = {
  moved: 'text-blue-400', created: 'text-emerald-400', deleted: 'text-red-400',
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function DashboardHome() {
  const user = useAuthStore(s => s.user)

  const { data: bots = [] } = useQuery({
    queryKey: ['bots'],
    queryFn: () => api.get('/api/bots/').then(r => r.data),
    enabled: !!(user?.is_admin || user?.can_access_bots),
    refetchInterval: 30000,
  })

  const { data: videos = [] } = useQuery({
    queryKey: ['youtube-videos'],
    queryFn: () => api.get('/api/youtube/').then(r => r.data),
    enabled: !!(user?.is_admin || user?.can_access_youtube),
    refetchInterval: 30000,
  })

  const { data: members = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/api/admin/users').then(r => r.data),
    enabled: !!user?.is_admin,
    refetchInterval: 30000,
  })

  const { data: requests = [] } = useQuery({
    queryKey: ['access-requests'],
    queryFn: () => api.get('/api/admin/access-requests').then(r => r.data),
    enabled: !!user?.is_admin,
    refetchInterval: 30000,
  })

  const { data: activity = [] } = useQuery<ActivityLog[]>({
    queryKey: ['youtube-activity-dashboard'],
    queryFn: () => api.get('/api/youtube/activity').then(r => r.data),
    enabled: !!(user?.is_admin || user?.can_access_youtube),
    refetchInterval: 20000,
  })

  const pendingRequests = (requests as { status: string }[]).filter(r => r.status === 'pending')
  const activeBots = (bots as { status?: string }[]).filter(b => b.status === 'active')

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

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active Bots',    value: activeBots.length,             icon: Bot,     color: 'text-blue-400',   show: user?.is_admin || user?.can_access_bots },
          { label: 'YouTube Videos', value: (videos as unknown[]).length,  icon: Youtube, color: 'text-red-400',    show: user?.is_admin || user?.can_access_youtube },
          { label: 'Team Members',   value: (members as unknown[]).length, icon: Users,   color: 'text-violet-400', show: user?.is_admin },
          { label: 'Pending Access', value: pendingRequests.length,        icon: Clock,   color: 'text-amber-400',  show: user?.is_admin },
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

      {/* Module cards */}
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

      {/* YouTube Activity Feed */}
      {(user?.is_admin || user?.can_access_youtube) && (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-red-400" />
            <h3 className="text-sm font-medium text-white">YouTube Activity</h3>
            <span className="ml-auto text-xs text-slate-600">Last 50 events · auto-refreshes</span>
          </div>

          {activity.length === 0 ? (
            <p className="text-sm text-slate-600 text-center py-6">No activity yet. Start moving videos through the pipeline!</p>
          ) : (
            <div className="space-y-1">
              {activity.slice(0, 12).map(log => {
                const toIcon = log.to_status ? STATUS_ICON[log.to_status] : null
                const ToIcon = toIcon
                return (
                  <div key={log.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/3 transition-all">
                    {/* Action icon */}
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      log.action === 'deleted' ? 'bg-red-500/10' :
                      log.action === 'created' ? 'bg-emerald-500/10' : 'bg-blue-500/10'
                    }`}>
                      {log.action === 'deleted' ? <Trash2 className="h-3.5 w-3.5 text-red-400" /> :
                       log.action === 'created' ? <FileText className="h-3.5 w-3.5 text-emerald-400" /> :
                       <ChevronRight className="h-3.5 w-3.5 text-blue-400" />}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-slate-300 truncate font-medium">{log.video_title}</span>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className={`text-xs font-medium ${ACTION_COLOR[log.action] || 'text-slate-500'}`}>
                          {log.action}
                        </span>
                        {log.from_status && log.to_status && (
                          <>
                            <span className={`text-[10px] font-medium ${STATUS_COLOR[log.from_status] || 'text-slate-500'}`}>
                              {log.from_status.replace('_', ' ')}
                            </span>
                            <ChevronRight className="h-2.5 w-2.5 text-slate-600" />
                            {ToIcon && <ToIcon className={`h-3 w-3 ${STATUS_COLOR[log.to_status] || 'text-slate-500'}`} />}
                            <span className={`text-[10px] font-medium ${STATUS_COLOR[log.to_status] || 'text-slate-500'}`}>
                              {log.to_status.replace('_', ' ')}
                            </span>
                          </>
                        )}
                        {log.done_by_name && (
                          <span className="text-[10px] text-slate-600">by {log.done_by_name}</span>
                        )}
                      </div>
                    </div>

                    {/* Time */}
                    <span className="text-[10px] text-slate-600 shrink-0">{timeAgo(log.created_at)}</span>
                  </div>
                )
              })}
              {activity.length > 12 && (
                <Link href="/dashboard/youtube" className="block text-center text-xs text-slate-600 hover:text-slate-400 pt-2">
                  View all {activity.length} events →
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

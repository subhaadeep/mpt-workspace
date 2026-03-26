'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useQuery } from '@tanstack/react-query'
import { Bot, Youtube, Shield, Users, Clock, TrendingUp, ArrowRight, Bell, Activity, Film, Scissors, Image, Upload, FileText, Archive, ChevronRight, Trash2, UserCheck, X, Eye, EyeOff, Key } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'

type ActivityLog = {
  id: number; video_title: string; action: string
  from_status?: string; to_status?: string; done_by_name?: string; created_at: string
}

type LoginLog = {
  id: number; user_id: number; username: string; full_name?: string
  logged_in_at: string; logged_out_at?: string; is_active: boolean
}

type UserWithPassword = {
  id: number; username: string; full_name?: string
  plain_password?: string; is_admin: boolean; is_super_admin: boolean
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString()
}

export default function DashboardHome() {
  const user = useAuthStore(s => s.user)
  const [showActiveUsers, setShowActiveUsers] = useState(false)
  const [showPasswordsModal, setShowPasswordsModal] = useState(false)
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set())

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

  const { data: loginLogs = [], refetch: refetchLogs } = useQuery<LoginLog[]>({
    queryKey: ['login-logs'],
    queryFn: () => api.get('/api/admin/login-logs').then(r => r.data),
    enabled: !!user?.is_admin && showActiveUsers,
    refetchInterval: showActiveUsers ? 15000 : false,
  })

  const { data: usersWithPasswords = [] } = useQuery<UserWithPassword[]>({
    queryKey: ['users-passwords'],
    queryFn: () => api.get('/api/admin/users/passwords').then(r => r.data),
    enabled: !!(user as unknown as { is_super_admin?: boolean })?.is_super_admin && showPasswordsModal,
  })

  const isSuperAdmin = !!(user as unknown as { is_super_admin?: boolean })?.is_super_admin

  const pendingRequests = (requests as { status: string }[]).filter(r => r.status === 'pending')
  const activeBots = (bots as { status?: string }[]).filter(b => b.status === 'active')
  const currentlyOnline = loginLogs.filter(l => l.is_active)
  const loginHistory = loginLogs.filter(l => !l.is_active)

  function toggleReveal(id: number) {
    setRevealedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const moduleCards = [
    {
      href: '/dashboard/bots', icon: Bot, label: 'Trading Bots',
      desc: 'Strategy versions, code & performance',
      color: 'from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:border-blue-400/40',
      iconBg: 'bg-blue-500/15', iconColor: 'text-blue-400',
      stat: activeBots.length, statLabel: 'active',
      show: user?.is_admin || user?.can_access_bots,
    },
    {
      href: '/dashboard/youtube', icon: Youtube, label: 'YouTube',
      desc: 'Video ideas, scripts & content pipeline',
      color: 'from-red-500/10 to-red-600/5 border-red-500/20 hover:border-red-400/40',
      iconBg: 'bg-red-500/15', iconColor: 'text-red-400',
      stat: (videos as unknown[]).length, statLabel: 'videos',
      show: user?.is_admin || user?.can_access_youtube,
    },
    {
      href: '/dashboard/admin', icon: Shield, label: 'Admin Panel',
      desc: 'Manage users, access requests & permissions',
      color: 'from-violet-500/10 to-violet-600/5 border-violet-500/20 hover:border-violet-400/40',
      iconBg: 'bg-violet-500/15', iconColor: 'text-violet-400',
      stat: pendingRequests.length, statLabel: 'pending',
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
          { label: 'Active Bots',    value: activeBots.length,             icon: Bot,       color: 'text-blue-400',   show: user?.is_admin || user?.can_access_bots },
          { label: 'YouTube Videos', value: (videos as unknown[]).length,  icon: Youtube,   color: 'text-red-400',    show: user?.is_admin || user?.can_access_youtube },
          { label: 'Team Members',   value: (members as unknown[]).length, icon: Users,     color: 'text-violet-400', show: user?.is_admin },
          { label: 'Pending Access', value: pendingRequests.length,        icon: Clock,     color: 'text-amber-400',  show: user?.is_admin },
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

      {/* Active Users card — admin only */}
      {user?.is_admin && (
        <div
          onClick={() => { setShowActiveUsers(true); refetchLogs() }}
          className="cursor-pointer rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/8 to-emerald-600/3 p-5 hover:border-emerald-400/40 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
                <UserCheck className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Active Users</p>
                <p className="text-xs text-slate-500 mt-0.5">Click to see who&apos;s currently logged in &amp; history</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-400">{currentlyOnline.length > 0 ? currentlyOnline.length : '—'}</p>
              <p className="text-xs text-slate-600">online now</p>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin — View Passwords card */}
      {isSuperAdmin && (
        <div
          onClick={() => setShowPasswordsModal(true)}
          className="cursor-pointer rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/8 to-yellow-600/3 p-5 hover:border-yellow-400/40 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/15">
              <Key className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="font-semibold text-white">User Passwords</p>
              <p className="text-xs text-slate-500">Super admin only — view &amp; manage stored credentials</p>
            </div>
          </div>
        </div>
      )}

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
            <p className="text-sm text-slate-600 text-center py-6">No activity yet.</p>
          ) : (
            <div className="space-y-1">
              {activity.slice(0, 12).map(log => {
                const toIcon = log.to_status ? STATUS_ICON[log.to_status] : null
                const ToIcon = toIcon
                return (
                  <div key={log.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/3 transition-all">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      log.action === 'deleted' ? 'bg-red-500/10' :
                      log.action === 'created' ? 'bg-emerald-500/10' : 'bg-blue-500/10'
                    }`}>
                      {log.action === 'deleted' ? <Trash2 className="h-3.5 w-3.5 text-red-400" /> :
                       log.action === 'created' ? <FileText className="h-3.5 w-3.5 text-emerald-400" /> :
                       <ChevronRight className="h-3.5 w-3.5 text-blue-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-slate-300 truncate font-medium">{log.video_title}</span>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className={`text-xs font-medium ${ACTION_COLOR[log.action] || 'text-slate-500'}`}>{log.action}</span>
                        {log.from_status && log.to_status && (
                          <>
                            <span className={`text-[10px] font-medium ${STATUS_COLOR[log.from_status] || 'text-slate-500'}`}>{log.from_status.replace('_', ' ')}</span>
                            <ChevronRight className="h-2.5 w-2.5 text-slate-600" />
                            {ToIcon && <ToIcon className={`h-3 w-3 ${STATUS_COLOR[log.to_status] || 'text-slate-500'}`} />}
                            <span className={`text-[10px] font-medium ${STATUS_COLOR[log.to_status] || 'text-slate-500'}`}>{log.to_status.replace('_', ' ')}</span>
                          </>
                        )}
                        {log.done_by_name && <span className="text-[10px] text-slate-600">by {log.done_by_name}</span>}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-600 shrink-0">{timeAgo(log.created_at)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ACTIVE USERS MODAL ── */}
      {showActiveUsers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-white/8 bg-[#0d1424] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-emerald-400" />
                <h2 className="text-base font-semibold text-white">Active Users</h2>
                <span className="ml-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-xs text-emerald-400">
                  {currentlyOnline.length} online
                </span>
              </div>
              <button onClick={() => setShowActiveUsers(false)} className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-6 space-y-5">
              {/* Currently Online */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-400 mb-3">Currently Online</h3>
                {currentlyOnline.length === 0 ? (
                  <p className="text-sm text-slate-600 py-3">No one currently logged in</p>
                ) : (
                  <div className="space-y-2">
                    {currentlyOnline.map(log => (
                      <div key={log.id} className="flex items-center gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 text-sm font-bold">
                          {(log.full_name || log.username).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{log.full_name || log.username}</p>
                          <p className="text-xs text-slate-500">@{log.username}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-xs text-emerald-400">Online</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">since {formatDate(log.logged_in_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Login History */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Login History</h3>
                {loginHistory.length === 0 ? (
                  <p className="text-sm text-slate-600 py-3">No history yet</p>
                ) : (
                  <div className="space-y-1.5">
                    {loginHistory.slice(0, 50).map(log => (
                      <div key={log.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/2 px-4 py-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700/40 text-slate-400 text-xs font-bold shrink-0">
                          {(log.full_name || log.username).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-300">{log.full_name || log.username}
                            <span className="text-xs text-slate-600 ml-1">@{log.username}</span>
                          </p>
                          <p className="text-[10px] text-slate-600 mt-0.5">
                            Login: {formatDate(log.logged_in_at)}
                            {log.logged_out_at && ` · Logout: ${formatDate(log.logged_out_at)}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PASSWORDS MODAL ── */}
      {showPasswordsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-yellow-500/20 bg-[#0d1424] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-yellow-400" />
                <h2 className="text-base font-semibold text-white">User Credentials</h2>
                <span className="text-xs text-yellow-600 border border-yellow-600/20 bg-yellow-500/10 rounded-full px-2 py-0.5">Super Admin Only</span>
              </div>
              <button onClick={() => { setShowPasswordsModal(false); setRevealedIds(new Set()) }}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto p-6 space-y-2">
              {usersWithPasswords.map(u => (
                <div key={u.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/2 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">
                      {u.full_name || u.username}
                      {u.is_super_admin && <span className="ml-2 text-[10px] text-purple-400 border border-purple-500/20 bg-purple-500/10 rounded-full px-1.5 py-0.5">Super Admin</span>}
                      {u.is_admin && !u.is_super_admin && <span className="ml-2 text-[10px] text-blue-400 border border-blue-500/20 bg-blue-500/10 rounded-full px-1.5 py-0.5">Admin</span>}
                    </p>
                    <p className="text-xs text-slate-500">@{u.username}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-slate-300 min-w-[100px] text-right">
                      {revealedIds.has(u.id)
                        ? (u.plain_password || <span className="text-slate-600 italic">not stored</span>)
                        : '••••••••'
                      }
                    </span>
                    <button
                      onClick={() => toggleReveal(u.id)}
                      className="rounded-lg p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/5">
                      {revealedIds.has(u.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useAuthStore } from '@/store/authStore'
import { Bot, Youtube, Shield, TrendingUp, Activity } from 'lucide-react'
import Link from 'next/link'
import DashboardShell from '@/components/layout/DashboardShell'

export default function DashboardHome() {
  const user = useAuthStore(s => s.user)

  const cards = [
    { href: '/dashboard/bots',    icon: Bot,     label: 'Bots',    desc: 'Strategy versions, code & performance', color: 'from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:border-blue-400/40',  iconColor: 'text-blue-400', roles: ['admin','manager','bot_user','full_user'] },
    { href: '/dashboard/youtube', icon: Youtube, label: 'YouTube', desc: 'Video ideas, scripts & pipeline',        color: 'from-red-500/10 to-red-600/5 border-red-500/20 hover:border-red-400/40',    iconColor: 'text-red-400',  roles: ['admin','manager','youtube_user','full_user'] },
    { href: '/dashboard/admin',   icon: Shield,  label: 'Admin',   desc: 'Users, permissions & logs',             color: 'from-violet-500/10 to-violet-600/5 border-violet-500/20 hover:border-violet-400/40', iconColor: 'text-violet-400', roles: ['admin','manager'] },
  ].filter(c => user?.role && c.roles.includes(user.role))

  return (
    <DashboardShell title="Dashboard">
      <div className="space-y-6 max-w-4xl">
        {/* Greeting */}
        <div>
          <h2 className="text-2xl font-bold text-white">
            Hello, {user?.full_name?.split(' ')[0] || 'there'} 👋
          </h2>
          <p className="text-slate-500 mt-1">Here's your workspace overview.</p>
        </div>

        {/* Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(c => {
            const Icon = c.icon
            return (
              <Link
                key={c.href}
                href={c.href}
                className={`group rounded-2xl border bg-gradient-to-br ${c.color} p-5 transition-all duration-200 hover:shadow-2xl hover:-translate-y-0.5`}
              >
                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ${c.iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-semibold text-white mb-1">{c.label}</p>
                <p className="text-xs text-slate-500">{c.desc}</p>
              </Link>
            )
          })}
        </div>

        {/* Stats row */}
        <div className="rounded-2xl border border-white/5 bg-white/2 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-medium text-slate-400">Quick Stats</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-white/3 px-4 py-3">
              <p className="text-2xl font-bold text-white">—</p>
              <p className="text-xs text-slate-500 mt-0.5">Active Bots</p>
            </div>
            <div className="rounded-xl bg-white/3 px-4 py-3">
              <p className="text-2xl font-bold text-white">—</p>
              <p className="text-xs text-slate-500 mt-0.5">YouTube Videos</p>
            </div>
            <div className="rounded-xl bg-white/3 px-4 py-3">
              <p className="text-2xl font-bold text-white">—</p>
              <p className="text-xs text-slate-500 mt-0.5">Team Members</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

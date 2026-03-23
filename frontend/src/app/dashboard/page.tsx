'use client'

import { useEffect, useState } from 'react'
import { Bot, Youtube, Users, Activity } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

type Stats = { bots: number; versions: number; videos: number; users: number }

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number | string; icon: React.ElementType; color: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
      <div className="flex items-center gap-3 md:gap-4">
        <div className={`flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-xs md:text-sm text-slate-500">{label}</p>
          <p className="text-xl md:text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [stats, setStats] = useState<Stats>({ bots: 0, versions: 0, videos: 0, users: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [b, v] = await Promise.allSettled([
          api.get('/api/bots'),
          api.get('/api/youtube/'),
        ])
        const bots = b.status === 'fulfilled' ? b.value.data : []
        const videos = v.status === 'fulfilled' ? v.value.data : []
        setStats({
          bots: bots.length,
          versions: bots.reduce((a: number, x: { versions?: unknown[] }) => a + (x.versions?.length || 0), 0),
          videos: videos.length,
          users: 0,
        })
      } finally { setLoading(false) }
    }
    load()
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">
            {greeting}, {user?.full_name || user?.email?.split('@')[0]} 👋
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">Here&apos;s what&apos;s happening today.</p>
        </div>
        <Badge variant="success">System Online</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <StatCard label="Total Bots"    value={loading ? '…' : stats.bots}     icon={Bot}      color="bg-blue-600" />
        <StatCard label="Bot Versions"  value={loading ? '…' : stats.versions} icon={Activity} color="bg-indigo-600" />
        <StatCard label="Videos"        value={loading ? '…' : stats.videos}   icon={Youtube}  color="bg-red-500" />
        <StatCard label="Users"         value={loading ? '…' : stats.users}    icon={Users}    color="bg-emerald-600" />
      </div>

      <div className="grid gap-3 md:gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 md:p-5">
          <h3 className="font-semibold text-slate-900 mb-1">Bot Management</h3>
          <p className="text-sm text-slate-500">Create and manage algo trading bots, versions, GA results and code.</p>
          <a href="/dashboard/bots" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline">Open Bots →</a>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 md:p-5">
          <h3 className="font-semibold text-slate-900 mb-1">YouTube Workflow</h3>
          <p className="text-sm text-slate-500">Manage your 5-stage video production pipeline from Script to Uploaded.</p>
          <a href="/dashboard/youtube" className="mt-3 inline-block text-sm font-medium text-red-600 hover:underline">Open YouTube →</a>
        </div>
      </div>
    </div>
  )
}

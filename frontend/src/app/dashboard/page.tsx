'use client'

import { useEffect, useState } from 'react'
import { Bot, Youtube, Users, Activity } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

type Stats = {
  bots: number
  versions: number
  videos: number
  users: number
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number | string
  icon: React.ElementType
  color: string
}) {
  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </CardBody>
    </Card>
  )
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [stats, setStats] = useState<Stats>({ bots: 0, versions: 0, videos: 0, users: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const [botsRes, videosRes] = await Promise.allSettled([
          api.get('/api/bots'),
          api.get('/api/youtube/videos'),
        ])

        const bots = botsRes.status === 'fulfilled' ? botsRes.value.data : []
        const videos = videosRes.status === 'fulfilled' ? videosRes.value.data : []
        const versions = bots.reduce((acc: number, b: { versions?: unknown[] }) => acc + (b.versions?.length || 0), 0)

        setStats({
          bots: bots.length,
          versions,
          videos: videos.length,
          users: 0,
        })
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {greeting}, {user?.full_name || user?.email?.split('@')[0]} 👋
          </h2>
          <p className="mt-1 text-slate-500">Here\'s what\'s happening in your workspace today.</p>
        </div>
        <Badge variant="success">System Online</Badge>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Bots" value={loading ? '...' : stats.bots} icon={Bot} color="bg-blue-600" />
        <StatCard label="Bot Versions" value={loading ? '...' : stats.versions} icon={Activity} color="bg-indigo-600" />
        <StatCard label="Videos" value={loading ? '...' : stats.videos} icon={Youtube} color="bg-red-500" />
        <StatCard label="Users" value={loading ? '...' : stats.users} icon={Users} color="bg-emerald-600" />
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardBody>
            <h3 className="font-semibold text-slate-900 mb-1">Bot Management</h3>
            <p className="text-sm text-slate-500">Create and manage algo trading bots, versions, GA results, performance data, and code.</p>
            <a href="/dashboard/bots" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline">Open Bots →</a>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h3 className="font-semibold text-slate-900 mb-1">YouTube Workflow</h3>
            <p className="text-sm text-slate-500">Manage video ideas, scripts, and track progress from Planned to Uploaded.</p>
            <a href="/dashboard/youtube" className="mt-3 inline-block text-sm font-medium text-red-600 hover:underline">Open YouTube →</a>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

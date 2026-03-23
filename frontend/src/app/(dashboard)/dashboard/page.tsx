'use client'
import { useAuthStore } from '@/store/authStore'
import { useBots } from '@/hooks/useBots'
import { useVideoIdeas } from '@/hooks/useYoutube'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Bot, Youtube, Users, Activity } from 'lucide-react'
import { formatDate } from '@/lib/utils'

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { data: bots } = useBots()
  const { data: videos } = useVideoIdeas()

  const canSeeBots = user && ['admin','manager','bot_user','full_user'].includes(user.role)
  const canSeeYoutube = user && ['admin','manager','youtube_user','full_user'].includes(user.role)

  return (
    <div>
      <TopBar title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* Greeting */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Good morning, {user?.full_name?.split(' ')[0]} 👋
          </h2>
          <p className="text-gray-500 text-sm mt-1">Here's what's happening in your workspace.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {canSeeBots && (
            <StatCard icon={Bot} label="Total Bots" value={bots?.length ?? 0} color="bg-brand-600" />
          )}
          {canSeeYoutube && (
            <StatCard icon={Youtube} label="Video Ideas" value={videos?.length ?? 0} color="bg-red-500" />
          )}
          {canSeeYoutube && (
            <StatCard
              icon={Activity}
              label="In Progress"
              value={videos?.filter((v) => v.status !== 'Uploaded').length ?? 0}
              color="bg-yellow-500"
            />
          )}
          {canSeeYoutube && (
            <StatCard
              icon={Youtube}
              label="Uploaded"
              value={videos?.filter((v) => v.status === 'Uploaded').length ?? 0}
              color="bg-green-500"
            />
          )}
        </div>

        {/* Recent Bots */}
        {canSeeBots && bots && bots.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Recent Bots</CardTitle></CardHeader>
            <div className="divide-y divide-gray-100">
              {bots.slice(0, 5).map((bot) => (
                <div key={bot.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{bot.name}</p>
                    <p className="text-xs text-gray-400">{bot.description}</p>
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(bot.created_at)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

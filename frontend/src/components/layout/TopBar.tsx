'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, LogOut, Menu, Youtube, Bot, ChevronRight, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

type ActivityLog = {
  id: number
  video_title?: string
  bot_name?: string
  action: string
  from_status?: string
  to_status?: string
  detail?: string
  done_by_name?: string
  created_at: string
}

function timeAgo(dateStr: string) {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

const STAGE_LABELS: Record<string, string> = {
  script: 'Script', raw_files: 'Raw Files', editing: 'Editing',
  thumbnail: 'Thumbnail', queue: 'Queue', uploaded: 'Uploaded',
}

export default function TopBar({ title }: { title?: string }) {
  const { user, logout } = useAuthStore()
  const { toggleMobileSidebar } = useUIStore()
  const router = useRouter()
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  const canYoutube = !!(user?.is_admin || user?.can_access_youtube)
  const canBots = !!(user?.is_admin || user?.can_access_bots)

  const bothPerms = canYoutube && canBots
  const [activeTab, setActiveTab] = useState<'youtube' | 'bots'>(canYoutube ? 'youtube' : 'bots')

  // When bell opens, set correct default tab
  useEffect(() => {
    if (bellOpen) setActiveTab(canYoutube ? 'youtube' : 'bots')
  }, [bellOpen, canYoutube])

  const { data: ytActivity = [] } = useQuery<ActivityLog[]>({
    queryKey: ['topbar-yt-activity'],
    queryFn: () => api.get('/api/youtube/activity').then(r => r.data),
    enabled: canYoutube && bellOpen,
    refetchInterval: bellOpen ? 20000 : false,
  })

  const { data: botActivity = [] } = useQuery<ActivityLog[]>({
    queryKey: ['topbar-bot-activity'],
    queryFn: () => api.get('/api/bots/activity').then(r => r.data),
    enabled: canBots && bellOpen,
    refetchInterval: bellOpen ? 20000 : false,
  })

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleLogout() {
    logout()
    router.replace('/login')
  }

  const initials = (user?.full_name || user?.username || 'U').charAt(0).toUpperCase()

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-[#0d1424]/80 backdrop-blur-sm px-4 md:px-6">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button onClick={toggleMobileSidebar}
          className="md:hidden rounded-lg p-2 text-slate-500 hover:bg-white/5">
          <Menu className="h-5 w-5" />
        </button>
        {title && <h1 className="text-base font-semibold text-white">{title}</h1>}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">

        {/* Bell — only show if user has at least one permission */}
        {(canYoutube || canBots) && (
          <div ref={bellRef} className="relative">
            <button
              onClick={() => setBellOpen(o => !o)}
              className="relative rounded-xl p-2 text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-colors">
              <Bell className="h-5 w-5" />
            </button>

            {bellOpen && (
              <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-white/8 bg-[#0d1424] shadow-2xl">

                {/* Tabs — only show tab bar if user has both permissions */}
                {bothPerms && (
                  <div className="flex border-b border-white/5">
                    <button
                      onClick={() => setActiveTab('youtube')}
                      className={`flex items-center gap-1.5 flex-1 justify-center py-3 text-xs font-medium border-b-2 transition-all ${
                        activeTab === 'youtube' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                      }`}>
                      <Youtube className="h-3.5 w-3.5" /> YouTube
                    </button>
                    <button
                      onClick={() => setActiveTab('bots')}
                      className={`flex items-center gap-1.5 flex-1 justify-center py-3 text-xs font-medium border-b-2 transition-all ${
                        activeTab === 'bots' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                      }`}>
                      <Bot className="h-3.5 w-3.5" /> Bots
                    </button>
                  </div>
                )}

                {/* Single header if only one permission */}
                {!bothPerms && (
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                    {canYoutube && <Youtube className="h-4 w-4 text-red-400" />}
                    {canBots && <Bot className="h-4 w-4 text-blue-400" />}
                    <span className="text-sm font-semibold text-white">
                      {canYoutube ? 'YouTube Activity' : 'Bot Activity'}
                    </span>
                  </div>
                )}

                <div className="max-h-72 overflow-y-auto">
                  {/* YouTube content */}
                  {(activeTab === 'youtube' || !bothPerms) && canYoutube && (
                    ytActivity.length === 0 ? (
                      <div className="py-8 text-center text-sm text-slate-600">No YouTube activity yet</div>
                    ) : (
                      ytActivity.slice(0, 15).map(log => (
                        <div key={log.id} className="px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/2">
                          <p className="text-xs font-medium text-white line-clamp-1">{log.video_title}</p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className={`text-[10px] font-medium ${
                              log.action === 'deleted' ? 'text-red-400' :
                              log.action === 'created' ? 'text-emerald-400' : 'text-blue-400'
                            }`}>{log.action}</span>
                            {log.from_status && log.to_status && (
                              <>
                                <span className="text-[10px] text-slate-500">{STAGE_LABELS[log.from_status] || log.from_status}</span>
                                <ChevronRight className="h-2.5 w-2.5 text-slate-600" />
                                <span className="text-[10px] text-emerald-400">{STAGE_LABELS[log.to_status] || log.to_status}</span>
                              </>
                            )}
                            {log.done_by_name && <span className="text-[10px] text-slate-600">by {log.done_by_name}</span>}
                            <span className="ml-auto text-[10px] text-slate-600">{timeAgo(log.created_at)}</span>
                          </div>
                        </div>
                      ))
                    )
                  )}

                  {/* Bots content */}
                  {(activeTab === 'bots' || (!bothPerms && canBots)) && canBots && (
                    botActivity.length === 0 ? (
                      <div className="py-8 text-center text-sm text-slate-600">No bot activity yet</div>
                    ) : (
                      botActivity.slice(0, 15).map(log => (
                        <div key={log.id} className="px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/2">
                          <p className="text-xs font-medium text-white line-clamp-1">{log.bot_name}</p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className={`text-[10px] font-medium ${
                              log.action === 'deleted' ? 'text-red-400' :
                              log.action === 'created' ? 'text-emerald-400' : 'text-blue-400'
                            }`}>{log.action}</span>
                            {log.detail && <span className="text-[10px] text-slate-500">{log.detail}</span>}
                            {log.done_by_name && <span className="text-[10px] text-slate-600">by {log.done_by_name}</span>}
                            <span className="ml-auto text-[10px] text-slate-600">{timeAgo(log.created_at)}</span>
                          </div>
                        </div>
                      ))
                    )
                  )}
                </div>

              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/3 px-3 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600/40 text-blue-200 text-xs font-bold">
            {initials}
          </div>
          <span className="hidden sm:block text-sm font-medium text-slate-300">
            {user?.full_name || user?.username}
          </span>
        </div>

        <button onClick={handleLogout}
          className="rounded-xl p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors">
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}

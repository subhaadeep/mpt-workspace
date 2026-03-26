'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, LogOut, Menu, ExternalLink, Youtube, ChevronRight, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useRouter } from 'next/navigation'

function timeAgo(date: Date) {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000)
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

export default function TopBar({ title }: { title?: string }) {
  const { user, logout } = useAuthStore()
  const { toggleMobileSidebar, pipelineNotifications, markAllRead, clearNotifications } = useUIStore()
  const router = useRouter()
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  const unread = pipelineNotifications.filter(n => !n.read).length

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

  const STAGE_LABELS: Record<string, string> = {
    script: 'Script', raw_files: 'Raw Files', editing: 'Editing',
    thumbnail: 'Thumbnail', uploaded: 'Uploaded',
  }

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
        <a href="/"
          className="hidden sm:flex items-center gap-1.5 rounded-xl border border-white/8 px-3 py-2 text-xs text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all">
          <ExternalLink className="h-3.5 w-3.5" /> Website
        </a>

        {/* Bell with notification dropdown */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => { setBellOpen(o => !o); if (!bellOpen) markAllRead() }}
            className="relative rounded-xl p-2 text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-colors">
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-white/8 bg-[#0d1424] shadow-2xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Youtube className="h-4 w-4 text-red-400" />
                  <span className="text-sm font-semibold text-white">Pipeline Activity</span>
                </div>
                {pipelineNotifications.length > 0 && (
                  <button onClick={clearNotifications} className="text-xs text-slate-600 hover:text-slate-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {pipelineNotifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-600">No activity yet</div>
                ) : (
                  pipelineNotifications.map(n => (
                    <div key={n.id} className={`px-4 py-3 border-b border-white/5 last:border-0 ${!n.read ? 'bg-white/2' : ''}`}>
                      <p className="text-xs font-medium text-white line-clamp-1">{n.videoTitle}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-slate-500">{STAGE_LABELS[n.fromStage] || n.fromStage}</span>
                        <ChevronRight className="h-3 w-3 text-slate-600" />
                        <span className="text-[10px] text-emerald-400 font-medium">{STAGE_LABELS[n.toStage] || n.toStage}</span>
                        <span className="ml-auto text-[10px] text-slate-600">{timeAgo(n.at)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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

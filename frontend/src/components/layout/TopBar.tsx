'use client'

import { Bell, LogOut, Menu, ExternalLink } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useRouter } from 'next/navigation'

export default function TopBar({ title }: { title?: string }) {
  const { user, logout } = useAuthStore()
  const { toggleMobileSidebar } = useUIStore()
  const router = useRouter()

  async function handleLogout() {
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
        {/* Back to website button */}
        <a
          href="/"
          className="hidden sm:flex items-center gap-1.5 rounded-xl border border-white/8 px-3 py-2 text-xs text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Website
        </a>

        <button className="relative rounded-xl p-2 text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-colors">
          <Bell className="h-5 w-5" />
        </button>

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

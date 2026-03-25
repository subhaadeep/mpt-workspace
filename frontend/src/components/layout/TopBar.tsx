'use client'

import { LogOut, Bell, Menu } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'

export default function TopBar({ title }: { title?: string }) {
  const { user, logout } = useAuthStore()
  const { openMobileSidebar } = useUIStore()

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-[#0d1424]/80 backdrop-blur-md px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button onClick={openMobileSidebar} className="md:hidden rounded-xl p-2 text-slate-500 hover:bg-white/5 hover:text-slate-300">
          <Menu className="h-5 w-5" />
        </button>
        {title && <h1 className="text-sm md:text-base font-semibold text-white">{title}</h1>}
      </div>
      <div className="flex items-center gap-1.5">
        <button className="rounded-xl p-2 text-slate-500 hover:bg-white/5 hover:text-slate-300">
          <Bell className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-2.5 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600/30 text-blue-300 text-xs font-bold">
            {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-xs font-medium text-slate-200 max-w-[120px] truncate">{user?.full_name || user?.email}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">{user?.role}</p>
          </div>
        </div>
        <button onClick={logout} title="Logout" className="rounded-xl p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-400">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}

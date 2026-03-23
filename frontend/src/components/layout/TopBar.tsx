'use client'

import { LogOut, Bell } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function TopBar({ title }: { title?: string }) {
  const { user, logout } = useAuthStore()

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        {title && <h1 className="text-lg font-semibold text-slate-900">{title}</h1>}
      </div>

      <div className="flex items-center gap-2">
        <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <Bell className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold">
            {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium text-slate-900">{user?.full_name || user?.email}</p>
            <p className="text-xs text-slate-400 uppercase">{user?.role}</p>
          </div>
        </div>

        <button
          onClick={logout}
          title="Logout"
          className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}

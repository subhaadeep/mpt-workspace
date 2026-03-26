'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Bot, Youtube, Shield, User, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'

const navItems = [
  { href: '/dashboard',         label: 'Dashboard', icon: LayoutDashboard, show: () => true },
  { href: '/dashboard/bots',    label: 'Bots',      icon: Bot,             show: (u: { is_admin: boolean; can_access_bots: boolean }) => u.is_admin || u.can_access_bots },
  { href: '/dashboard/youtube', label: 'YouTube',   icon: Youtube,         show: (u: { is_admin: boolean; can_access_youtube: boolean }) => u.is_admin || u.can_access_youtube },
  { href: '/dashboard/admin',   label: 'Admin',     icon: Shield,          show: (u: { is_admin: boolean }) => u.is_admin },
  { href: '/dashboard/profile', label: 'Profile',   icon: User,            show: () => true },
]

function NavLinks({ collapse, onNav }: { collapse: boolean; onNav?: () => void }) {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  if (!user) return null
  return (
    <nav className="flex-1 px-2 py-3 space-y-0.5">
      {navItems
        .filter(item => item.show(user as never))
        .map(item => {
          const Icon = item.icon
          const active = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} onClick={onNav}
              title={collapse ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
              )}>
              <Icon className={cn('shrink-0 h-4 w-4', active && 'text-blue-400')} />
              {!collapse && <span>{item.label}</span>}
            </Link>
          )
        })}
    </nav>
  )
}

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const collapse = !sidebarOpen

  return (
    <aside className={cn(
      'relative hidden md:flex flex-col border-r border-white/5 bg-[#0d1424] transition-all duration-200',
      sidebarOpen ? 'w-56' : 'w-[60px]'
    )}>
      <div className={cn('flex h-16 items-center border-b border-white/5 px-3 gap-3 overflow-hidden', collapse && 'justify-center')}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-500/20">M</div>
        {!collapse && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">MPT Workspace</p>
            <p className="truncate text-xs text-slate-500">Trading & Content</p>
          </div>
        )}
      </div>

      <NavLinks collapse={collapse} />

      <button onClick={toggleSidebar}
        className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#0d1424] shadow-md hover:bg-[#1e293b]">
        {sidebarOpen ? <ChevronLeft className="h-3 w-3 text-slate-400" /> : <ChevronRight className="h-3 w-3 text-slate-400" />}
      </button>

      {!collapse && user && (
        <div className="border-t border-white/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600/30 text-blue-300 text-xs font-bold">
              {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-slate-300">{user.full_name || user.username}</p>
              <p className="truncate text-[10px] text-slate-500 uppercase tracking-wide">{user.is_admin ? 'Admin' : 'Member'}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

export function MobileSidebar() {
  const user = useAuthStore((s) => s.user)
  const { mobileSidebarOpen, closeMobileSidebar } = useUIStore()
  const pathname = usePathname()
  if (!mobileSidebarOpen) return null
  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeMobileSidebar} />
      <aside className="absolute left-0 top-0 h-full w-72 bg-[#0d1424] border-r border-white/5 flex flex-col shadow-2xl">
        <div className="flex h-16 items-center justify-between border-b border-white/5 px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white text-sm font-bold">M</div>
            <div>
              <p className="text-sm font-semibold text-white">MPT Workspace</p>
              <p className="text-xs text-slate-500">Trading & Content</p>
            </div>
          </div>
          <button onClick={closeMobileSidebar} className="rounded-lg p-2 text-slate-500 hover:bg-white/5">
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {user && navItems.filter(item => item.show(user as never)).map(item => {
            const Icon = item.icon
            const active = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href} onClick={closeMobileSidebar}
                className={cn('flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                  active ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                )}>
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        {user && (
          <div className="border-t border-white/5 px-4 py-4">
            <p className="text-sm font-medium text-slate-300">{user.full_name || user.username}</p>
            <p className="text-xs text-slate-500 uppercase mt-0.5">{user.is_admin ? 'Admin' : 'Member'}</p>
          </div>
        )}
      </aside>
    </div>
  )
}

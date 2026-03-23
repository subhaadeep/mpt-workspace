'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Bot, Youtube, Shield, User,
  ChevronLeft, ChevronRight, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'

const navItems = [
  { href: '/dashboard',         label: 'Dashboard', icon: LayoutDashboard, roles: ['admin','manager','bot_user','youtube_user','full_user'] },
  { href: '/dashboard/bots',    label: 'Bots',      icon: Bot,             roles: ['admin','manager','bot_user','full_user'] },
  { href: '/dashboard/youtube', label: 'YouTube',   icon: Youtube,         roles: ['admin','manager','youtube_user','full_user'] },
  { href: '/dashboard/admin',   label: 'Admin',     icon: Shield,          roles: ['admin','manager'] },
  { href: '/dashboard/profile', label: 'Profile',   icon: User,            roles: ['admin','manager','bot_user','youtube_user','full_user'] },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const { sidebarOpen } = useUIStore()

  return (
    <nav className="flex-1 p-3 space-y-1">
      {navItems
        .filter((item) => user?.role && item.roles.includes(user.role))
        .map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={!sidebarOpen ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
    </nav>
  )
}

// Desktop sidebar
export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const { sidebarOpen, toggleSidebar } = useUIStore()

  return (
    <aside
      className={cn(
        'relative hidden md:flex flex-col border-r border-slate-200 bg-white transition-all duration-200',
        sidebarOpen ? 'w-60' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-slate-100 px-4 gap-3 overflow-hidden">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold">M</div>
        {sidebarOpen && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">MPT Workspace</p>
            <p className="truncate text-xs text-slate-500">Trading & Content</p>
          </div>
        )}
      </div>

      {/* Nav links - desktop shows label only when open */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems
          .filter((item) => {
            const user2 = useAuthStore.getState().user
            return user2?.role && item.roles.includes(user2.role)
          })
          .map((item) => {
            const Icon = item.icon
            const { sidebarOpen: so } = useUIStore.getState()
            // We need reactive version - use component below
            return null
          })}
      </nav>

      <DesktopNav />

      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm hover:bg-slate-50"
      >
        {sidebarOpen ? <ChevronLeft className="h-3 w-3 text-slate-500" /> : <ChevronRight className="h-3 w-3 text-slate-500" />}
      </button>

      {/* User info */}
      {sidebarOpen && user && (
        <div className="border-t border-slate-100 px-4 py-3">
          <p className="truncate text-xs font-medium text-slate-700">{user.full_name || user.email}</p>
          <p className="truncate text-xs text-slate-400 uppercase">{user.role}</p>
        </div>
      )}
    </aside>
  )
}

function DesktopNav() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const { sidebarOpen } = useUIStore()

  return (
    <nav className="flex-1 p-3 space-y-1">
      {navItems
        .filter((item) => user?.role && item.roles.includes(user.role))
        .map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              title={!sidebarOpen ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
    </nav>
  )
}

// Mobile sidebar drawer
export function MobileSidebar() {
  const user = useAuthStore((s) => s.user)
  const { mobileSidebarOpen, closeMobileSidebar } = useUIStore()
  const pathname = usePathname()

  if (!mobileSidebarOpen) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closeMobileSidebar}
      />
      {/* Panel */}
      <aside className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold">M</div>
            <div>
              <p className="text-sm font-semibold text-slate-900">MPT Workspace</p>
              <p className="text-xs text-slate-500">Trading & Content</p>
            </div>
          </div>
          <button onClick={closeMobileSidebar} className="rounded-lg p-2 hover:bg-slate-100">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems
            .filter((item) => user?.role && item.roles.includes(user.role))
            .map((item) => {
              const Icon = item.icon
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileSidebar}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                    active ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
        </nav>

        {/* Footer */}
        {user && (
          <div className="border-t border-slate-100 px-4 py-4">
            <p className="text-sm font-medium text-slate-700">{user.full_name || user.email}</p>
            <p className="text-xs text-slate-400 uppercase mt-0.5">{user.role}</p>
          </div>
        )}
      </aside>
    </div>
  )
}

'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import {
  LayoutDashboard, Bot, Youtube, ShieldCheck, ChevronLeft, ChevronRight, LogOut, User
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin','manager','bot_user','youtube_user','full_user'] },
  { href: '/dashboard/bots', label: 'Bots', icon: Bot, roles: ['admin','manager','bot_user','full_user'] },
  { href: '/dashboard/youtube', label: 'YouTube', icon: Youtube, roles: ['admin','manager','youtube_user','full_user'] },
  { href: '/dashboard/admin', label: 'Admin', icon: ShieldCheck, roles: ['admin','manager'] },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  const visibleItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  )

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-gray-900 text-white transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-800">
        {!sidebarCollapsed && (
          <span className="text-lg font-bold tracking-tight text-white">MPT<span className="text-brand-400"> Workspace</span></span>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-gray-800 transition ml-auto"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!sidebarCollapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User Footer */}
      <div className="px-2 py-4 border-t border-gray-800 space-y-1">
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <User className="w-5 h-5 shrink-0" />
          {!sidebarCollapsed && <span className="truncate">{user?.full_name || 'Profile'}</span>}
        </Link>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-red-900/40 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}

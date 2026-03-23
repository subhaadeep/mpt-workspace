'use client'
import { useAuthStore } from '@/store/authStore'
import { ROLE_LABELS } from '@/lib/constants'
import { Badge } from '@/components/ui/Badge'

export function TopBar({ title }: { title: string }) {
  const { user } = useAuthStore()

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between bg-white/80 backdrop-blur border-b border-gray-200 px-6 py-3">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      {user && (
        <div className="flex items-center gap-3">
          <Badge variant="blue">{ROLE_LABELS[user.role] ?? user.role}</Badge>
          <span className="text-sm text-gray-600">{user.full_name}</span>
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-bold">
            {user.full_name?.[0]?.toUpperCase()}
          </div>
        </div>
      )}
    </header>
  )
}

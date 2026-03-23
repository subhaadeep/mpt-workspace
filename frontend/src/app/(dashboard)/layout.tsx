'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { PageSpinner } from '@/components/ui/Spinner'
import { getAccessToken } from '@/lib/auth'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, fetchMe } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace('/login')
      return
    }
    if (!user) {
      fetchMe().catch(() => router.replace('/login'))
    }
  }, [user, fetchMe, router])

  if (!user) return <PageSpinner />

  return <DashboardShell>{children}</DashboardShell>
}

'use client'

import { type ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { useAuthStore } from '@/store/authStore'
import { PageLoader } from '@/components/ui/Spinner'

export default function DashboardShell({
  children,
  title,
}: {
  children: ReactNode
  title?: string
}) {
  const router = useRouter()
  const { user, hydrated, fetchMe } = useAuthStore()

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  useEffect(() => {
    if (hydrated && !user) router.replace('/login')
  }, [hydrated, user, router])

  if (!hydrated) return <PageLoader />
  if (!user) return null

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar title={title} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}

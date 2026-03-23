'use client'

import { type ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from './Sidebar'
import { MobileSidebar } from './Sidebar'
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

  useEffect(() => { fetchMe() }, [fetchMe])
  useEffect(() => {
    if (hydrated && !user) router.replace('/login')
  }, [hydrated, user, router])

  if (!hydrated) return <PageLoader />
  if (!user) return null

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <Sidebar />
      {/* Mobile drawer */}
      <MobileSidebar />

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <TopBar title={title} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

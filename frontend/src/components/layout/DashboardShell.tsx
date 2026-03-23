'use client'
import { Sidebar } from './Sidebar'
import { ToastContainer } from '@/components/ui/ToastContainer'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <ToastContainer />
    </div>
  )
}

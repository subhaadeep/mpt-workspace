import DashboardShell from '@/components/layout/DashboardShell'
import { type ReactNode } from 'react'

export default function BotsLayout({ children }: { children: ReactNode }) {
  return <DashboardShell title="Bots">{children}</DashboardShell>
}

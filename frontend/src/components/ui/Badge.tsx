import { cn } from '@/lib/utils'

type Variant = 'default' | 'success' | 'error' | 'warning' | 'info'

const VARIANTS: Record<Variant, string> = {
  default: 'bg-slate-700/50 text-slate-300 border-slate-600/30',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  error:   'bg-red-500/10 text-red-400 border-red-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  info:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
}

export function Badge({ children, variant = 'default', className }: {
  children: React.ReactNode; variant?: Variant; className?: string
}) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', VARIANTS[variant], className)}>
      {children}
    </span>
  )
}

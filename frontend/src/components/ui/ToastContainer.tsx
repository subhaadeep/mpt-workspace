'use client'

import { useUIStore } from '@/store/uiStore'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const icons = {
  success: <CheckCircle className="h-4 w-4 text-green-600" />,
  error: <AlertCircle className="h-4 w-4 text-red-600" />,
  info: <Info className="h-4 w-4 text-blue-600" />,
}

const styles = {
  success: 'border-green-200 bg-green-50',
  error: 'border-red-200 bg-red-50',
  info: 'border-blue-200 bg-blue-50',
}

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore()

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg text-sm max-w-sm animate-in slide-in-from-right',
            styles[t.type]
          )}
        >
          {icons[t.type]}
          <span className="flex-1 text-slate-800">{t.message}</span>
          <button onClick={() => removeToast(t.id)}>
            <X className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      ))}
    </div>
  )
}

'use client'
import { useUIStore } from '@/store/uiStore'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const iconMap = {
  default: <Info className="w-4 h-4" />,
  success: <CheckCircle className="w-4 h-4 text-green-500" />,
  destructive: <AlertCircle className="w-4 h-4 text-red-500" />,
}

const bgMap = {
  default: 'bg-white border-gray-200',
  success: 'bg-white border-green-200',
  destructive: 'bg-white border-red-200',
}

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore()
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-start gap-3 rounded-xl border p-4 shadow-lg animate-in slide-in-from-bottom-2',
            bgMap[t.variant ?? 'default']
          )}
        >
          {iconMap[t.variant ?? 'default']}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{t.title}</p>
            {t.description && <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>}
          </div>
          <button onClick={() => removeToast(t.id)} className="p-0.5 hover:bg-gray-100 rounded">
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      ))}
    </div>
  )
}

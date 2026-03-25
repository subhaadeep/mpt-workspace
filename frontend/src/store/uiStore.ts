import { create } from 'zustand'

type Toast = { id: string; message: string; type: 'success' | 'error' | 'info' | 'warning' }

type UIState = {
  sidebarOpen: boolean
  mobileSidebarOpen: boolean
  toasts: Toast[]
  toggleSidebar: () => void
  openMobileSidebar: () => void
  closeMobileSidebar: () => void
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: true,
  mobileSidebarOpen: false,
  toasts: [],
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  openMobileSidebar:  () => set({ mobileSidebarOpen: true }),
  closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
  addToast: (message, type = 'info') => {
    const id = Math.random().toString(36).slice(2)
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => get().removeToast(id), 3500)
  },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}))

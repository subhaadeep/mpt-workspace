import { create } from 'zustand'

type Toast = { id: string; message: string; type: 'success' | 'error' | 'info' | 'warning' }

export type PipelineNotification = {
  id: string
  videoTitle: string
  fromStage: string
  toStage: string
  at: Date
  read: boolean
}

type UIState = {
  sidebarOpen: boolean
  mobileSidebarOpen: boolean
  toasts: Toast[]
  toggleSidebar: () => void
  toggleMobileSidebar: () => void
  openMobileSidebar: () => void
  closeMobileSidebar: () => void
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void
  // Pipeline notifications
  pipelineNotifications: PipelineNotification[]
  addPipelineNotification: (videoTitle: string, fromStage: string, toStage: string) => void
  markAllRead: () => void
  clearNotifications: () => void
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: true,
  mobileSidebarOpen: false,
  toasts: [],
  pipelineNotifications: [],

  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  toggleMobileSidebar: () => set(s => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),
  openMobileSidebar: () => set({ mobileSidebarOpen: true }),
  closeMobileSidebar: () => set({ mobileSidebarOpen: false }),

  addToast: (message, type = 'info') => {
    const id = Math.random().toString(36).slice(2)
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => get().removeToast(id), 3500)
  },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  addPipelineNotification: (videoTitle, fromStage, toStage) => {
    const id = Math.random().toString(36).slice(2)
    set(s => ({
      pipelineNotifications: [
        { id, videoTitle, fromStage, toStage, at: new Date(), read: false },
        ...s.pipelineNotifications,
      ].slice(0, 50), // keep last 50
    }))
  },

  markAllRead: () => set(s => ({
    pipelineNotifications: s.pipelineNotifications.map(n => ({ ...n, read: true }))
  })),

  clearNotifications: () => set({ pipelineNotifications: [] }),
}))

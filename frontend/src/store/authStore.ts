'use client'

import { create } from 'zustand'
import api from '@/lib/api'
import { clearTokens, setTokens, getAccessToken } from '@/lib/auth'

export type User = {
  id: number
  email: string
  full_name?: string
  role: string
  is_active: boolean
}

type AuthState = {
  user: User | null
  loading: boolean
  hydrated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  hydrated: false,

  login: async (email, password) => {
    set({ loading: true })
    try {
      const { data } = await api.post('/api/auth/login', { email, password })
      setTokens(data.access_token, data.refresh_token)
      const me = await api.get('/api/users/me')
      set({ user: me.data, loading: false, hydrated: true })
    } catch (e) {
      clearTokens()
      set({ user: null, loading: false, hydrated: true })
      throw e
    }
  },

  logout: () => {
    clearTokens()
    set({ user: null, hydrated: true })
    if (typeof window !== 'undefined') window.location.href = '/login'
  },

  fetchMe: async () => {
    if (!getAccessToken()) {
      set({ user: null, hydrated: true })
      return
    }
    set({ loading: true })
    try {
      const { data } = await api.get('/api/users/me')
      set({ user: data, loading: false, hydrated: true })
    } catch {
      clearTokens()
      set({ user: null, loading: false, hydrated: true })
    }
  },
}))

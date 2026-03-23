import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/api'
import { setTokens, clearTokens } from '@/lib/auth'

export interface User {
  id: number
  email: string
  full_name: string
  role: string
  is_active: boolean
}

interface AuthState {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        const params = new URLSearchParams()
        params.append('username', email)
        params.append('password', password)
        const { data } = await api.post('/api/auth/login', params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
        setTokens(data.access_token, data.refresh_token)
        const me = await api.get('/api/users/me')
        set({ user: me.data, isLoading: false })
      },

      logout: () => {
        clearTokens()
        set({ user: null })
      },

      fetchMe: async () => {
        try {
          const { data } = await api.get('/api/users/me')
          set({ user: data })
        } catch {
          clearTokens()
          set({ user: null })
        }
      },
    }),
    { name: 'auth-store', partialize: (s) => ({ user: s.user }) }
  )
)

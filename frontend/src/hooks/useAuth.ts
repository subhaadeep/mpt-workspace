'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export function useRequireAuth() {
  const { user, fetchMe } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      fetchMe().catch(() => router.replace('/login'))
    }
  }, [user, fetchMe, router])

  return user
}

export function useRequireRole(roles: string[]) {
  const user = useRequireAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !roles.includes(user.role)) {
      router.replace('/dashboard')
    }
  }, [user, roles, router])

  return user
}

'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ROLE_LABELS } from '@/lib/constants'
import api from '@/lib/api'

export default function ProfilePage() {
  const { user, fetchMe } = useAuthStore()
  const addToast = useUIStore((s) => s.addToast)
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')

  const updateName = useMutation({
    mutationFn: () => api.patch('/api/users/me', { full_name: fullName }).then((r) => r.data),
    onSuccess: () => {
      fetchMe()
      addToast('Name updated!', 'success')
    },
    onError: () => addToast('Failed to update name', 'error'),
  })

  const updatePw = useMutation({
    mutationFn: () =>
      api.post('/api/auth/change-password', {
        current_password: currentPw,
        new_password: newPw,
      }).then((r) => r.data),
    onSuccess: () => {
      addToast('Password changed!', 'success')
      setCurrentPw('')
      setNewPw('')
    },
    onError: () => addToast('Failed to change password', 'error'),
  })

  if (!user) return null

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Profile</h2>
        <p className="text-slate-500 text-sm mt-0.5">Manage your account details</p>
      </div>

      {/* Identity card */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-slate-900">Account Info</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white text-xl font-bold">
              {(user.full_name || user.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{user.full_name || '—'}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
              <div className="mt-1">
                <Badge variant="info">{ROLE_LABELS[user.role] ?? user.role}</Badge>
              </div>
            </div>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); updateName.mutate() }}
            className="space-y-3 pt-2"
          >
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your display name"
            />
            <Button type="submit" loading={updateName.isPending} size="sm">
              Save Name
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-slate-900">Change Password</h3>
        </CardHeader>
        <CardBody>
          <form
            onSubmit={(e) => { e.preventDefault(); updatePw.mutate() }}
            className="space-y-3"
          >
            <Input
              label="Current Password"
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              required
            />
            <Input
              label="New Password"
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              required
            />
            <Button type="submit" loading={updatePw.isPending} size="sm">
              Change Password
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}

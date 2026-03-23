'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, UserCog } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import { ROLES, ROLE_LABELS } from '@/lib/constants'

const roleOptions = ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))

type UserItem = {
  id: number
  email: string
  full_name?: string
  role: string
  is_active: boolean
}

function roleBadge(role: string) {
  const map: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
    admin: 'danger',
    manager: 'warning',
    bot_user: 'info',
    youtube_user: 'info',
    full_user: 'success',
  }
  return <Badge variant={map[role] ?? 'default'}>{ROLE_LABELS[role] ?? role}</Badge>
}

export default function AdminPage() {
  const queryClient = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)
  const currentUser = useAuthStore((s) => s.user)
  const [showCreate, setShowCreate] = useState(false)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('bot_user')

  const { data: users = [], isLoading } = useQuery<UserItem[]>({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/api/admin/users').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (payload: object) => api.post('/api/admin/users', payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      addToast('User created!', 'success')
      setShowCreate(false)
      setEmail('')
      setFullName('')
      setPassword('')
      setRole('bot_user')
    },
    onError: () => addToast('Failed to create user', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      addToast('User deleted', 'info')
    },
    onError: () => addToast('Failed to delete user', 'error'),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Admin Panel</h2>
          <p className="text-slate-500 text-sm mt-0.5">Manage workspace users and permissions</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> New User
        </Button>
      </div>

      {/* User Table */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : users.length === 0 ? (
        <EmptyState icon={UserCog} title="No users" description="Create the first workspace user." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3 text-left font-medium text-slate-500">#</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-500">Name</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-500">Email</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-500">Role</th>
                  <th className="px-6 py-3 text-left font-medium text-slate-500">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-slate-400">{u.id}</td>
                    <td className="px-6 py-3 font-medium text-slate-900">{u.full_name || '—'}</td>
                    <td className="px-6 py-3 text-slate-600">{u.email}</td>
                    <td className="px-6 py-3">{roleBadge(u.role)}</td>
                    <td className="px-6 py-3">
                      <Badge variant={u.is_active ? 'success' : 'danger'}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-right">
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => deleteMutation.mutate(u.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create User">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate({ email, full_name: fullName, password, role })
          }}
          className="space-y-4"
        >
          <Input label="Full Name" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input label="Email" type="email" placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Password" type="password" placeholder="Min 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)} options={roleOptions} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Create User</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { useUsers, useCreateUser, useUpdateUserRole, useDeleteUser } from '@/hooks/useAdmin'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ROLES, ROLE_LABELS } from '@/lib/constants'
import { Plus, Trash2, UserCheck } from 'lucide-react'

const roleOptions = ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))

export default function AdminPage() {
  const { user: me } = useAuthStore()
  const router = useRouter()
  useEffect(() => {
    if (me && !['admin', 'manager'].includes(me.role)) router.replace('/dashboard')
  }, [me, router])

  const { data: users, isLoading } = useUsers()
  const createUser = useCreateUser()
  const updateRole = useUpdateUserRole()
  const deleteUser = useDeleteUser()
  const { addToast } = useUIStore()

  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('bot_user')

  const handleCreate = async () => {
    if (!email || !fullName || !password) return
    try {
      await createUser.mutateAsync({ email, full_name: fullName, password, role })
      addToast({ title: 'User created!', variant: 'success' })
      setOpen(false); setEmail(''); setFullName(''); setPassword(''); setRole('bot_user')
    } catch {
      addToast({ title: 'Failed to create user', variant: 'destructive' })
    }
  }

  const handleRoleChange = async (id: number, newRole: string) => {
    try {
      await updateRole.mutateAsync({ id, role: newRole })
      addToast({ title: 'Role updated', variant: 'success' })
    } catch {
      addToast({ title: 'Failed to update role', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this user?')) return
    try {
      await deleteUser.mutateAsync(id)
      addToast({ title: 'User deleted', variant: 'success' })
    } catch {
      addToast({ title: 'Failed to delete user', variant: 'destructive' })
    }
  }

  return (
    <div>
      <TopBar title="Admin Panel" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{users?.length ?? 0} users</p>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4" /> New User
          </Button>
        </div>

        {isLoading && <PageSpinner />}

        <Card>
          <CardHeader><CardTitle>Users</CardTitle></CardHeader>
          <div className="divide-y divide-gray-100">
            {users?.map((u) => (
              <div key={u.id} className="px-5 py-3 flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold shrink-0">
                  {u.full_name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.full_name}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  {roleOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <Badge variant={u.is_active ? 'green' : 'red'}>
                  {u.is_active ? 'Active' : 'Inactive'}
                </Badge>
                {u.id !== me?.id && (
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New User">
        <div className="space-y-4">
          <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)} options={roleOptions} />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={createUser.isPending}>Create User</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2, XCircle, User, Shield, Clock, Trash2,
  Bot, Youtube, ShieldCheck, ShieldOff, Crown, Users,
  UserCog, Plus, Settings2
} from 'lucide-react'
import api from '@/lib/api'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { Spinner } from '@/components/ui/Spinner'

type AccessRequest = {
  id: number; username: string; full_name: string
  status: 'pending' | 'approved' | 'rejected'; created_at: string
}

type UserRecord = {
  id: number; username: string; full_name?: string
  is_admin: boolean; is_super_admin?: boolean; is_active: boolean
  is_sub_admin?: boolean
  can_manage_users?: boolean; can_manage_bots?: boolean
  can_manage_youtube?: boolean; can_view_logs?: boolean
  can_access_bots: boolean; can_access_youtube: boolean; created_at: string
}

function PermToggle({ label, icon: Icon, checked, onChange, color = 'blue' }: {
  label: string; icon: React.ElementType; checked: boolean
  onChange: (v: boolean) => void; color?: string
}) {
  const colors: Record<string, string> = {
    blue: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    red: 'border-red-500/30 bg-red-500/10 text-red-400',
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    purple: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
  }
  const inactive = 'border-white/8 bg-white/3 text-slate-600'
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
        checked ? colors[color] : inactive
      }`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}

export default function AdminPage() {
  const qc = useQueryClient()
  const { addToast } = useUIStore()
  const currentUser = useAuthStore(s => s.user)
  const isSuperAdmin = !!currentUser?.is_super_admin
  const isFullAdmin = !!currentUser?.is_admin
  const [accessOptions, setAccessOptions] = useState<Record<number, { bots: boolean; youtube: boolean }>>({})
  const [showSubAdminForm, setShowSubAdminForm] = useState(false)
  const [subAdminTarget, setSubAdminTarget] = useState<number | null>(null)
  const [subAdminPerms, setSubAdminPerms] = useState({
    can_manage_users: false, can_manage_bots: false,
    can_manage_youtube: false, can_view_logs: false
  })

  const { data: requests = [], isLoading: loadingReqs } = useQuery<AccessRequest[]>({
    queryKey: ['access-requests'],
    queryFn: () => api.get('/api/admin/access-requests').then(r => r.data),
  })

  const { data: users = [], isLoading: loadingUsers } = useQuery<UserRecord[]>({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/api/admin/users').then(r => r.data),
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, bots, youtube }: { id: number; bots: boolean; youtube: boolean }) =>
      api.post(`/api/admin/access-requests/${id}/approve?can_access_bots=${bots}&can_access_youtube=${youtube}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['access-requests'] })
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      addToast('User approved!', 'success')
    },
    onError: () => addToast('Failed to approve', 'error'),
  })

  const rejectMutation = useMutation({
    mutationFn: (id: number) => api.post(`/api/admin/access-requests/${id}/reject`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['access-requests'] }); addToast('Request rejected', 'info') },
    onError: () => addToast('Failed to reject', 'error'),
  })

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) => api.patch(`/api/admin/users/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); addToast('User updated', 'success') },
    onError: () => addToast('Failed to update user', 'error'),
  })

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/users/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); addToast('User deleted', 'info') },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      addToast(msg ?? 'Failed to delete user', 'error')
    },
  })

  const promoteSubAdminMutation = useMutation({
    mutationFn: (data: { user_id: number } & typeof subAdminPerms) =>
      api.post('/api/admin/sub-admins', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      addToast('Sub-admin promoted!', 'success')
      setShowSubAdminForm(false)
      setSubAdminTarget(null)
    },
    onError: () => addToast('Failed to promote sub-admin', 'error'),
  })

  const updateSubAdminMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) =>
      api.patch(`/api/admin/sub-admins/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); addToast('Permissions updated', 'success') },
    onError: () => addToast('Failed to update permissions', 'error'),
  })

  const demoteSubAdminMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/sub-admins/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); addToast('Sub-admin removed', 'info') },
    onError: () => addToast('Failed to demote sub-admin', 'error'),
  })

  function confirmDelete(u: UserRecord) {
    if (u.is_super_admin) { addToast('Cannot delete the super admin account', 'error'); return }
    if (u.is_admin && !isSuperAdmin) { addToast('Only super admin can delete admin accounts', 'error'); return }
    if (!window.confirm(`Delete "${u.full_name || u.username}"? This cannot be undone.`)) return
    deleteUserMutation.mutate(u.id)
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const processedRequests = requests.filter(r => r.status !== 'pending')

  function getAccess(id: number) { return accessOptions[id] ?? { bots: false, youtube: false } }
  function setAccess(id: number, key: 'bots' | 'youtube', val: boolean) {
    setAccessOptions(prev => ({ ...prev, [id]: { ...getAccess(id), [key]: val } }))
  }

  const superAdminUser = users.find(u => u.is_super_admin)
  const adminUsers = users.filter(u => u.is_admin && !u.is_super_admin)
  const subAdminUsers = users.filter(u => u.is_sub_admin && !u.is_admin)
  const nonAdminUsers = users.filter(u => !u.is_admin && !u.is_sub_admin)

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">

      {/* PAGE HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 px-8 py-7 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(59,130,246,0.12),_transparent_60%)]" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/20 border border-blue-500/30 shadow-lg">
            <Shield className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Admin Panel</h1>
            <p className="text-sm text-slate-400 mt-0.5">Manage access, users and permissions</p>
          </div>
          {isSuperAdmin && (
            <div className="ml-auto flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1.5">
              <Crown className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-xs font-semibold text-purple-300">Super Admin</span>
            </div>
          )}
        </div>
        <div className="relative mt-5 flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/5 px-4 py-2">
            <Users className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-300"><span className="font-bold text-white">{users.length}</span> Users</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/5 px-4 py-2">
            <Shield className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-slate-300"><span className="font-bold text-white">{adminUsers.length + 1}</span> Admins</span>
          </div>
          {subAdminUsers.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/5 px-4 py-2">
              <UserCog className="h-4 w-4 text-cyan-400" />
              <span className="text-sm text-slate-300"><span className="font-bold text-white">{subAdminUsers.length}</span> Sub-Admins</span>
            </div>
          )}
          {pendingRequests.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-amber-300"><span className="font-bold text-amber-200">{pendingRequests.length}</span> Pending</span>
            </div>
          )}
        </div>
      </div>

      {/* PENDING REQUESTS */}
      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-amber-400" /> Pending Access Requests
          {pendingRequests.length > 0 && (
            <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-xs text-amber-400">{pendingRequests.length}</span>
          )}
        </h2>
        {loadingReqs && <div className="flex justify-center py-8"><Spinner /></div>}
        {!loadingReqs && pendingRequests.length === 0 && (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] py-8 text-center">
            <Clock className="h-7 w-7 text-slate-700 mx-auto mb-2" />
            <p className="text-sm text-slate-600">No pending requests</p>
          </div>
        )}
        <div className="space-y-3">
          {pendingRequests.map(req => (
            <div key={req.id} className="group rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/8 to-orange-500/5 p-5 hover:border-amber-500/40 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/20">
                    <User className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{req.full_name}</span>
                      <span className="text-xs text-slate-500">@{req.username}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{new Date(req.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-400">Pending</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={getAccess(req.id).bots}
                    onChange={e => setAccess(req.id, 'bots', e.target.checked)}
                    className="h-4 w-4 rounded accent-blue-500" />
                  <Bot className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-sm text-slate-300">Bots access</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={getAccess(req.id).youtube}
                    onChange={e => setAccess(req.id, 'youtube', e.target.checked)}
                    className="h-4 w-4 rounded accent-red-500" />
                  <Youtube className="h-3.5 w-3.5 text-red-400" />
                  <span className="text-sm text-slate-300">YouTube access</span>
                </label>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => approveMutation.mutate({ id: req.id, bots: getAccess(req.id).bots, youtube: getAccess(req.id).youtube })}
                  disabled={approveMutation.isPending}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 px-5 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-600/30 hover:border-emerald-500/50 hover:text-emerald-300 transition-all disabled:opacity-50">
                  <CheckCircle2 className="h-4 w-4" /> Approve
                </button>
                <button
                  onClick={() => rejectMutation.mutate(req.id)}
                  disabled={rejectMutation.isPending}
                  className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-5 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 hover:border-red-500/40 transition-all disabled:opacity-50">
                  <XCircle className="h-4 w-4" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SUPER ADMIN */}
      {superAdminUser && (
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Crown className="h-3.5 w-3.5 text-purple-400" /> Super Admin
          </h2>
          <div className="flex items-center gap-3 rounded-2xl border border-purple-500/25 bg-gradient-to-r from-purple-500/10 to-transparent px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600/20 border border-purple-500/25">
              <Crown className="h-5 w-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <span className="font-semibold text-white">{superAdminUser.full_name || superAdminUser.username}</span>
              <span className="text-xs text-slate-500 ml-2">@{superAdminUser.username}</span>
            </div>
            <span className="rounded-full bg-purple-500/15 border border-purple-500/25 px-3 py-1 text-xs font-semibold text-purple-300">Super Admin</span>
          </div>
        </section>
      )}

      {/* ADMIN ACCOUNTS */}
      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-400" /> Admin Accounts
          <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-xs text-slate-500">{adminUsers.length}</span>
        </h2>
        {adminUsers.length === 0 && (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] py-6 text-center">
            <p className="text-sm text-slate-600">No other admin accounts</p>
          </div>
        )}
        <div className="space-y-2">
          {adminUsers.map(u => (
            <div key={u.id} className="group flex items-center gap-3 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/8 to-transparent px-5 py-3.5 hover:border-blue-500/35 transition-all">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/20">
                <Shield className="h-4 w-4 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-white">{u.full_name || u.username}</span>
                <span className="text-xs text-slate-500 ml-2">@{u.username}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-500/15 border border-blue-500/25 px-3 py-1 text-xs font-semibold text-blue-300">Admin</span>
                {isSuperAdmin && (
                  <button onClick={() => confirmDelete(u)} disabled={deleteUserMutation.isPending} title="Delete"
                    className="rounded-lg p-2 text-slate-600 hover:bg-red-500/15 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all disabled:opacity-40">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SUB-ADMINS */}
      {(isSuperAdmin || isFullAdmin) && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <UserCog className="h-3.5 w-3.5 text-cyan-400" /> Sub-Admins
              <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-xs text-slate-500">{subAdminUsers.length}</span>
            </h2>
            {isSuperAdmin && (
              <button onClick={() => setShowSubAdminForm(s => !s)}
                className="flex items-center gap-1.5 rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-400 hover:bg-cyan-500/20 transition-all">
                <Plus className="h-3.5 w-3.5" /> Add Sub-Admin
              </button>
            )}
          </div>

          {/* Create Sub-Admin Form */}
          {showSubAdminForm && isSuperAdmin && (
            <div className="mb-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5 space-y-4">
              <p className="text-sm font-semibold text-cyan-300 flex items-center gap-2">
                <UserCog className="h-4 w-4" /> Promote a user to Sub-Admin
              </p>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Select User</label>
                <select
                  value={subAdminTarget ?? ''}
                  onChange={e => setSubAdminTarget(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/8 bg-[#0d1424] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50">
                  <option value="">Choose a user...</option>
                  {nonAdminUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name || u.username} (@{u.username})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-2 block">Permissions</label>
                <div className="flex flex-wrap gap-2">
                  <PermToggle label="Manage Users" icon={Users} color="blue"
                    checked={subAdminPerms.can_manage_users}
                    onChange={v => setSubAdminPerms(p => ({ ...p, can_manage_users: v }))} />
                  <PermToggle label="Manage Bots" icon={Bot} color="emerald"
                    checked={subAdminPerms.can_manage_bots}
                    onChange={v => setSubAdminPerms(p => ({ ...p, can_manage_bots: v }))} />
                  <PermToggle label="Manage YouTube" icon={Youtube} color="red"
                    checked={subAdminPerms.can_manage_youtube}
                    onChange={v => setSubAdminPerms(p => ({ ...p, can_manage_youtube: v }))} />
                  <PermToggle label="View Logs" icon={Clock} color="amber"
                    checked={subAdminPerms.can_view_logs}
                    onChange={v => setSubAdminPerms(p => ({ ...p, can_view_logs: v }))} />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!subAdminTarget) return
                    promoteSubAdminMutation.mutate({ user_id: subAdminTarget, ...subAdminPerms })
                  }}
                  disabled={!subAdminTarget || promoteSubAdminMutation.isPending}
                  className="flex items-center gap-2 rounded-xl bg-cyan-600/20 border border-cyan-500/30 px-5 py-2 text-sm font-medium text-cyan-400 hover:bg-cyan-600/30 disabled:opacity-50 transition-all">
                  <UserCog className="h-4 w-4" /> Promote
                </button>
                <button onClick={() => setShowSubAdminForm(false)}
                  className="rounded-xl border border-white/8 px-4 py-2 text-sm text-slate-500 hover:bg-white/5 transition-all">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {subAdminUsers.length === 0 && !showSubAdminForm && (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] py-6 text-center">
              <UserCog className="h-7 w-7 text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-600">No sub-admins yet</p>
            </div>
          )}

          <div className="space-y-2">
            {subAdminUsers.map(u => (
              <div key={u.id} className="group rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/8 to-transparent px-5 py-4 hover:border-cyan-500/35 transition-all">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-600/15 border border-cyan-500/20">
                    <UserCog className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-white">{u.full_name || u.username}</span>
                    <span className="text-xs text-slate-500 ml-2">@{u.username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-cyan-500/15 border border-cyan-500/25 px-3 py-1 text-xs font-semibold text-cyan-300">Sub-Admin</span>
                    {isSuperAdmin && (
                      <button onClick={() => demoteSubAdminMutation.mutate(u.id)}
                        title="Remove sub-admin"
                        className="rounded-lg p-2 text-slate-600 hover:bg-red-500/15 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                {/* Inline permission toggles */}
                {isSuperAdmin && (
                  <div className="mt-3 flex flex-wrap gap-2 pt-3 border-t border-white/5">
                    <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide self-center mr-1 flex items-center gap-1">
                      <Settings2 className="h-3 w-3" /> Perms:
                    </span>
                    <PermToggle label="Users" icon={Users} color="blue"
                      checked={!!u.can_manage_users}
                      onChange={v => updateSubAdminMutation.mutate({ id: u.id, data: { can_manage_users: v } })} />
                    <PermToggle label="Bots" icon={Bot} color="emerald"
                      checked={!!u.can_manage_bots}
                      onChange={v => updateSubAdminMutation.mutate({ id: u.id, data: { can_manage_bots: v } })} />
                    <PermToggle label="YouTube" icon={Youtube} color="red"
                      checked={!!u.can_manage_youtube}
                      onChange={v => updateSubAdminMutation.mutate({ id: u.id, data: { can_manage_youtube: v } })} />
                    <PermToggle label="Logs" icon={Clock} color="amber"
                      checked={!!u.can_view_logs}
                      onChange={v => updateSubAdminMutation.mutate({ id: u.id, data: { can_view_logs: v } })} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* REGULAR USERS */}
      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-slate-400" /> All Users
          <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-xs text-slate-500">{nonAdminUsers.length}</span>
        </h2>
        {loadingUsers && <div className="flex justify-center py-8"><Spinner /></div>}
        {!loadingUsers && nonAdminUsers.length === 0 && (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] py-8 text-center">
            <Users className="h-7 w-7 text-slate-700 mx-auto mb-2" />
            <p className="text-sm text-slate-600">No regular users</p>
          </div>
        )}
        <div className="space-y-2">
          {nonAdminUsers.map(u => (
            <div key={u.id} className="group rounded-2xl border border-white/8 bg-white/[0.025] px-5 py-4 hover:border-white/15 hover:bg-white/[0.04] transition-all">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-700/50 border border-white/8">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-white">{u.full_name || u.username}</span>
                    <span className="text-xs text-slate-500 ml-2">@{u.username}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="flex items-center gap-1.5 cursor-pointer rounded-lg border border-white/8 bg-white/5 px-2.5 py-1.5 hover:bg-blue-500/10 hover:border-blue-500/20 transition-all">
                    <input type="checkbox" checked={u.can_access_bots}
                      onChange={e => updateUserMutation.mutate({ id: u.id, data: { can_access_bots: e.target.checked } })}
                      className="h-3.5 w-3.5 rounded accent-blue-500" />
                    <Bot className="h-3.5 w-3.5 text-blue-400" />
                    <span className="text-xs text-slate-400">Bots</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer rounded-lg border border-white/8 bg-white/5 px-2.5 py-1.5 hover:bg-red-500/10 hover:border-red-500/20 transition-all">
                    <input type="checkbox" checked={u.can_access_youtube}
                      onChange={e => updateUserMutation.mutate({ id: u.id, data: { can_access_youtube: e.target.checked } })}
                      className="h-3.5 w-3.5 rounded accent-red-500" />
                    <Youtube className="h-3.5 w-3.5 text-red-400" />
                    <span className="text-xs text-slate-400">YouTube</span>
                  </label>
                  <button
                    onClick={() => {
                      if (window.confirm(`Make ${u.full_name || u.username} an admin? This gives full access.`)) {
                        updateUserMutation.mutate({ id: u.id, data: { is_admin: true } })
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-blue-500/25 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-all">
                    <ShieldCheck className="h-3.5 w-3.5" /> Make Admin
                  </button>
                  <button
                    onClick={() => confirmDelete(u)}
                    disabled={deleteUserMutation.isPending}
                    title="Delete user"
                    className="rounded-lg p-2 text-slate-600 hover:bg-red-500/15 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all disabled:opacity-40">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* REVOKE ADMIN */}
      {adminUsers.length > 0 && isSuperAdmin && (
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <ShieldOff className="h-3.5 w-3.5 text-red-400" /> Revoke Admin Access
          </h2>
          <div className="space-y-2">
            {adminUsers.map(u => (
              <div key={u.id} className="group flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.025] px-5 py-3.5 hover:border-red-500/20 hover:bg-red-500/5 transition-all">
                <div>
                  <span className="text-sm font-medium text-white">{u.full_name || u.username}</span>
                  <span className="text-xs text-slate-600 ml-2">@{u.username}</span>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm(`Revoke admin from ${u.full_name || u.username}?`)) {
                      updateUserMutation.mutate({ id: u.id, data: { is_admin: false } })
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-3.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all">
                  <ShieldOff className="h-3.5 w-3.5" /> Revoke Admin
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PROCESSED REQUESTS */}
      {processedRequests.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Processed Requests</h2>
          <div className="space-y-2">
            {processedRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-3.5">
                <div>
                  <span className="text-sm font-medium text-slate-300">{req.full_name}</span>
                  <span className="text-xs text-slate-600 ml-2">@{req.username}</span>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                  req.status === 'approved'
                    ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>{req.status === 'approved' ? '✓ Approved' : '✗ Rejected'}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

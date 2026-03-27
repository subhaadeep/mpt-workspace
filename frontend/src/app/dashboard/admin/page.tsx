'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2, XCircle, User, Shield, Clock, Trash2,
  Bot, Youtube, ShieldCheck, ShieldOff, Crown, Users
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
  can_access_bots: boolean; can_access_youtube: boolean; created_at: string
}

export default function AdminPage() {
  const qc = useQueryClient()
  const { addToast } = useUIStore()
  const currentUser = useAuthStore(s => s.user)
  const isSuperAdmin = !!currentUser?.is_super_admin
  const [accessOptions, setAccessOptions] = useState<Record<number, { bots: boolean; youtube: boolean }>>({})

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

  // ✅ FIXED: Super admin CAN delete users (except themselves / other super admins)
  // Regular admins can delete non-admin users only
  function confirmDelete(u: UserRecord) {
    if (u.is_super_admin) { addToast('Cannot delete the super admin account', 'error'); return }
    if (u.is_admin && !isSuperAdmin) { addToast('Only the super admin can delete admin accounts', 'error'); return }
    if (!window.confirm(`Delete "${u.full_name || u.username}"? This cannot be undone.`)) return
    deleteUserMutation.mutate(u.id)
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const processedRequests = requests.filter(r => r.status !== 'pending')

  function getAccess(id: number) { return accessOptions[id] ?? { bots: false, youtube: false } }
  function setAccess(id: number, key: 'bots' | 'youtube', val: boolean) {
    setAccessOptions(prev => ({ ...prev, [id]: { ...getAccess(id), [key]: val } }))
  }

  const nonAdminUsers = users.filter(u => !u.is_admin)
  const adminUsers = users.filter(u => u.is_admin)

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">

      {/* PAGE HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 px-8 py-7 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(59,130,246,0.12),_transparent_60%)]" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/20 border border-blue-500/30 shadow-lg shadow-blue-500/10">
            <Shield className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Admin Panel</h1>
            <p className="text-sm text-slate-400 mt-0.5">Manage access requests, users and permissions</p>
          </div>
          {isSuperAdmin && (
            <div className="ml-auto flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1.5">
              <Crown className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-xs font-semibold text-purple-300">Super Admin</span>
            </div>
          )}
        </div>
        {/* Stats row */}
        <div className="relative mt-5 flex gap-4 flex-wrap">
          <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/5 px-4 py-2">
            <Users className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-300"><span className="font-bold text-white">{users.length}</span> Total Users</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/5 px-4 py-2">
            <Shield className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-slate-300"><span className="font-bold text-white">{adminUsers.length}</span> Admins</span>
          </div>
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
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] py-10 text-center">
            <Clock className="h-8 w-8 text-slate-700 mx-auto mb-2" />
            <p className="text-sm text-slate-600">No pending requests</p>
          </div>
        )}
        <div className="space-y-3">
          {pendingRequests.map(req => (
            <div key={req.id} className="group rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/8 to-orange-500/5 p-5 shadow-sm hover:border-amber-500/40 transition-all">
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
              <div className="mt-4 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer group/check">
                  <input type="checkbox" checked={getAccess(req.id).bots}
                    onChange={e => setAccess(req.id, 'bots', e.target.checked)}
                    className="h-4 w-4 rounded accent-blue-500" />
                  <Bot className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-sm text-slate-300 group-hover/check:text-white transition-colors">Bots access</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group/check">
                  <input type="checkbox" checked={getAccess(req.id).youtube}
                    onChange={e => setAccess(req.id, 'youtube', e.target.checked)}
                    className="h-4 w-4 rounded accent-red-500" />
                  <Youtube className="h-3.5 w-3.5 text-red-400" />
                  <span className="text-sm text-slate-300 group-hover/check:text-white transition-colors">YouTube access</span>
                </label>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => approveMutation.mutate({ id: req.id, bots: getAccess(req.id).bots, youtube: getAccess(req.id).youtube })}
                  disabled={approveMutation.isPending}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 px-5 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-600/30 hover:border-emerald-500/50 hover:text-emerald-300 transition-all disabled:opacity-50 shadow-sm">
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

      {/* ADMIN USERS */}
      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-400" /> Admin Accounts
        </h2>
        <div className="space-y-2">
          {adminUsers.map(u => (
            <div key={u.id} className="group flex items-center gap-3 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/8 to-transparent px-5 py-3.5 hover:border-blue-500/35 hover:from-blue-500/12 transition-all">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/20">
                {u.is_super_admin
                  ? <Crown className="h-4 w-4 text-purple-400" />
                  : <Shield className="h-4 w-4 text-blue-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white truncate">{u.full_name || u.username}</span>
                  <span className="text-xs text-slate-500 shrink-0">@{u.username}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {u.is_super_admin
                  ? <span className="rounded-full bg-purple-500/15 border border-purple-500/25 px-3 py-1 text-xs font-semibold text-purple-300">Super Admin</span>
                  : <span className="rounded-full bg-blue-500/15 border border-blue-500/25 px-3 py-1 text-xs font-semibold text-blue-300">Admin</span>
                }
                {/* ✅ Super admin sees delete on non-super-admin admins; regular admin sees nothing */}
                {isSuperAdmin && !u.is_super_admin && (
                  <button
                    onClick={() => confirmDelete(u)}
                    disabled={deleteUserMutation.isPending}
                    title="Delete user"
                    className="rounded-lg p-2 text-slate-600 hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/20 border border-transparent transition-all disabled:opacity-40">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* REGULAR USERS */}
      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-slate-400" /> All Users
          <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-xs text-slate-500">{nonAdminUsers.length}</span>
        </h2>
        {loadingUsers && <div className="flex justify-center py-8"><Spinner /></div>}
        {!loadingUsers && nonAdminUsers.length === 0 && (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] py-10 text-center">
            <Users className="h-8 w-8 text-slate-700 mx-auto mb-2" />
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
                    <span className="font-semibold text-white truncate">{u.full_name || u.username}</span>
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
                    className="flex items-center gap-1.5 rounded-lg border border-blue-500/25 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 hover:border-blue-500/40 transition-all">
                    <ShieldCheck className="h-3.5 w-3.5" /> Make Admin
                  </button>
                  {/* ✅ Both admin and super admin can delete regular users */}
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
      {adminUsers.filter(u => !u.is_super_admin).length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <ShieldOff className="h-3.5 w-3.5 text-red-400" /> Revoke Admin Access
          </h2>
          <div className="space-y-2">
            {adminUsers.filter(u => !u.is_super_admin).map(u => (
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
                  className="flex items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-3.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40 transition-all">
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

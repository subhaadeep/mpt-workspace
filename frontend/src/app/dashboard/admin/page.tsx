'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, XCircle, User, Shield, Clock, Trash2, Bot, Youtube } from 'lucide-react'
import api from '@/lib/api'
import { useUIStore } from '@/store/uiStore'
import DashboardShell from '@/components/layout/DashboardShell'
import { Spinner } from '@/components/ui/Spinner'

type AccessRequest = {
  id: number
  username: string
  full_name: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

type UserRecord = {
  id: number
  username: string
  full_name?: string
  is_admin: boolean
  is_active: boolean
  can_access_bots: boolean
  can_access_youtube: boolean
  created_at: string
}

export default function AdminPage() {
  const qc = useQueryClient()
  const { addToast } = useUIStore()
  const [approvingId, setApprovingId] = useState<number | null>(null)
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
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['access-requests'] })
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      addToast('User approved and account created!', 'success')
      setApprovingId(null)
    },
    onError: () => addToast('Failed to approve', 'error'),
  })

  const rejectMutation = useMutation({
    mutationFn: (id: number) => api.post(`/api/admin/access-requests/${id}/reject`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['access-requests'] })
      addToast('Request rejected', 'info')
    },
  })

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) => api.patch(`/api/admin/users/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      addToast('User updated', 'success')
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      addToast('User deleted', 'info')
    },
  })

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const processedRequests = requests.filter(r => r.status !== 'pending')

  function getAccess(id: number) {
    return accessOptions[id] ?? { bots: false, youtube: false }
  }

  function setAccess(id: number, key: 'bots' | 'youtube', val: boolean) {
    setAccessOptions(prev => ({ ...prev, [id]: { ...getAccess(id), [key]: val } }))
  }

  return (
    <DashboardShell>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Shield className="h-6 w-6 text-blue-400" /> Admin Panel</h1>
          <p className="text-sm text-slate-500 mt-1">Manage access requests and users</p>
        </div>

        {/* ── PENDING REQUESTS ── */}
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" /> Pending Access Requests
            {pendingRequests.length > 0 && (
              <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-xs text-amber-400">{pendingRequests.length}</span>
            )}
          </h2>

          {loadingReqs && <div className="flex justify-center py-8"><Spinner /></div>}

          {!loadingReqs && pendingRequests.length === 0 && (
            <div className="rounded-2xl border border-white/5 bg-white/2 py-10 text-center text-sm text-slate-600">No pending requests</div>
          )}

          <div className="space-y-3">
            {pendingRequests.map(req => (
              <div key={req.id} className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="font-semibold text-white">{req.full_name}</span>
                      <span className="text-xs text-slate-500">@{req.username}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{new Date(req.created_at).toLocaleString()}</p>
                  </div>
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-xs text-amber-400">Pending</span>
                </div>

                {/* Access toggles */}
                <div className="mt-3 flex flex-wrap gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={getAccess(req.id).bots}
                      onChange={e => setAccess(req.id, 'bots', e.target.checked)}
                      className="rounded accent-blue-500" />
                    <Bot className="h-3.5 w-3.5 text-blue-400" />
                    <span className="text-sm text-slate-300">Bots access</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={getAccess(req.id).youtube}
                      onChange={e => setAccess(req.id, 'youtube', e.target.checked)}
                      className="rounded accent-red-500" />
                    <Youtube className="h-3.5 w-3.5 text-red-400" />
                    <span className="text-sm text-slate-300">YouTube access</span>
                  </label>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => approveMutation.mutate({ id: req.id, bots: getAccess(req.id).bots, youtube: getAccess(req.id).youtube })}
                    disabled={approveMutation.isPending}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-600/30 disabled:opacity-60">
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </button>
                  <button
                    onClick={() => rejectMutation.mutate(req.id)}
                    disabled={rejectMutation.isPending}
                    className="flex items-center gap-1.5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-60">
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── USERS ── */}
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">All Users</h2>
          {loadingUsers && <div className="flex justify-center py-8"><Spinner /></div>}
          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/5 bg-white/2 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{u.full_name || u.username}</span>
                    <span className="text-xs text-slate-500">@{u.username}</span>
                    {u.is_admin && <span className="rounded-full bg-blue-500/15 border border-blue-500/20 px-2 py-0.5 text-[10px] text-blue-400">Admin</span>}
                  </div>
                </div>

                {!u.is_admin && (
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={u.can_access_bots}
                        onChange={e => updateUserMutation.mutate({ id: u.id, data: { can_access_bots: e.target.checked } })}
                        className="accent-blue-500" />
                      <Bot className="h-3.5 w-3.5 text-blue-400" />
                      <span className="text-xs text-slate-400">Bots</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={u.can_access_youtube}
                        onChange={e => updateUserMutation.mutate({ id: u.id, data: { can_access_youtube: e.target.checked } })}
                        className="accent-red-500" />
                      <Youtube className="h-3.5 w-3.5 text-red-400" />
                      <span className="text-xs text-slate-400">YouTube</span>
                    </label>
                    <button onClick={() => deleteUserMutation.mutate(u.id)}
                      className="rounded-lg p-1.5 text-slate-600 hover:bg-red-500/10 hover:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── PROCESSED REQUESTS ── */}
        {processedRequests.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Processed Requests</h2>
            <div className="space-y-2">
              {processedRequests.map(req => (
                <div key={req.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/2 px-4 py-3">
                  <div>
                    <span className="text-sm text-slate-300">{req.full_name}</span>
                    <span className="text-xs text-slate-600 ml-2">@{req.username}</span>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs border ${
                    req.status === 'approved'
                      ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>{req.status}</span>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </DashboardShell>
  )
}

'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { User, Lock, Shield, Bot, Youtube, CheckCircle } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import api from '@/lib/api'

export default function ProfilePage() {
  const { user, fetchMe } = useAuthStore()
  const addToast = useUIStore((s) => s.addToast)
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')

  const updateName = useMutation({
    mutationFn: () => api.patch('/api/users/me', { full_name: fullName }).then(r => r.data),
    onSuccess: () => { fetchMe(); addToast('Name updated!', 'success') },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      addToast(msg || 'Failed to update name', 'error')
    },
  })

  const updatePw = useMutation({
    mutationFn: () => api.post('/api/users/me/change-password', {
      current_password: currentPw,
      new_password: newPw,
    }).then(r => r.data),
    onSuccess: () => {
      addToast('Password changed!', 'success')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      addToast(msg || 'Failed to change password', 'error')
    },
  })

  if (!user) return null

  const initials = (user.full_name || user.username || 'U').slice(0, 2).toUpperCase()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Profile</h2>
        <p className="text-slate-500 text-sm mt-0.5">Manage your account details</p>
      </div>

      {/* Identity Card */}
      <div className="rounded-2xl border border-white/8 bg-[#0d1424] p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white text-xl font-bold shadow-lg shadow-blue-500/25">
            {initials}
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{user.full_name || user.username}</p>
            <p className="text-sm text-slate-500">@{user.username}</p>
            <div className="flex items-center gap-2 mt-1.5">
              {user.is_admin && (
                <span className="flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/25 px-2.5 py-0.5 text-xs text-blue-400">
                  <Shield className="h-3 w-3" /> Admin
                </span>
              )}
              {user.can_access_bots && (
                <span className="flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-xs text-slate-400">
                  <Bot className="h-3 w-3" /> Bots
                </span>
              )}
              {user.can_access_youtube && (
                <span className="flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-xs text-slate-400">
                  <Youtube className="h-3 w-3" /> YouTube
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Update Name */}
        <div className="border-t border-white/5 pt-5">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-medium text-slate-300">Display Name</p>
          </div>
          <form onSubmit={e => { e.preventDefault(); updateName.mutate() }} className="flex gap-2">
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your display name"
              className="flex-1 rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition"
            />
            <button type="submit" disabled={updateName.isPending || !fullName.trim()}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-all">
              {updateName.isPending ? <Spinner size="sm" /> : <CheckCircle className="h-4 w-4" />}
              Save
            </button>
          </form>
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-2xl border border-white/8 bg-[#0d1424] p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock className="h-4 w-4 text-slate-500" />
          <p className="text-sm font-medium text-slate-300">Change Password</p>
        </div>
        <form onSubmit={e => {
          e.preventDefault()
          if (newPw !== confirmPw) { addToast('Passwords do not match', 'error'); return }
          updatePw.mutate()
        }} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Current Password</label>
            <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required
              className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">New Password</label>
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required
              className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Confirm New Password</label>
            <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required
              className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition" />
          </div>
          {newPw && confirmPw && newPw !== confirmPw && (
            <p className="text-xs text-red-400">Passwords do not match</p>
          )}
          <button type="submit" disabled={updatePw.isPending}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/6 border border-white/8 py-2.5 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50 transition-all">
            {updatePw.isPending ? <Spinner size="sm" /> : <Lock className="h-4 w-4" />}
            Change Password
          </button>
        </form>
      </div>
    </div>
  )
}

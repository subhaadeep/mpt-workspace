'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { Spinner } from '@/components/ui/Spinner'
import { Eye, EyeOff, Zap, UserPlus, ArrowLeft } from 'lucide-react'
import api from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore(s => s.login)

  const [mode, setMode] = useState<'login' | 'request'>('login')

  // Login state
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Request access state
  const [reqName, setReqName] = useState('')
  const [reqUsername, setReqUsername] = useState('')
  const [reqPassword, setReqPassword] = useState('')
  const [reqShowPwd, setReqShowPwd] = useState(false)
  const [reqLoading, setReqLoading] = useState(false)
  const [reqError, setReqError] = useState('')
  const [reqSuccess, setReqSuccess] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      router.replace('/dashboard')
    } catch {
      setError('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault()
    setReqError('')
    setReqLoading(true)
    try {
      await api.post('/api/users/request-access', {
        username: reqUsername,
        full_name: reqName,
        password: reqPassword,
      })
      setReqSuccess(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setReqError(msg || 'Something went wrong. Try again.')
    } finally {
      setReqLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-blue-800/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-white/8 bg-[#0d1424]/90 backdrop-blur-xl p-8 shadow-2xl">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-xl shadow-blue-500/25 mb-4">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">MPT Workspace</h1>
            <p className="text-sm text-slate-500 mt-1">
              {mode === 'login' ? 'Sign in to your workspace' : 'Request access to the workspace'}
            </p>
          </div>

          {/* ── LOGIN FORM ── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="your username"
                  className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition focus:border-blue-500/60 focus:bg-white/6 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-3 pr-11 text-sm text-white placeholder-slate-600 outline-none transition focus:border-blue-500/60 focus:bg-white/6 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-3 text-slate-500 hover:text-slate-300">
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</div>
              )}

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-60 transition-all">
                {loading ? <Spinner size="sm" /> : 'Sign In'}
              </button>

              <button type="button" onClick={() => setMode('request')}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/8 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all">
                <UserPlus className="h-4 w-4" /> Request Access
              </button>
            </form>
          )}

          {/* ── REQUEST ACCESS FORM ── */}
          {mode === 'request' && !reqSuccess && (
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name</label>
                <input type="text" required value={reqName} onChange={e => setReqName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Desired Username</label>
                <input type="text" required value={reqUsername} onChange={e => setReqUsername(e.target.value)}
                  placeholder="e.g. john_doe"
                  className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                <div className="relative">
                  <input type={reqShowPwd ? 'text' : 'password'} required value={reqPassword} onChange={e => setReqPassword(e.target.value)}
                    placeholder="Choose a password"
                    className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-3 pr-11 text-sm text-white placeholder-slate-600 outline-none transition focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20" />
                  <button type="button" onClick={() => setReqShowPwd(!reqShowPwd)} className="absolute right-3 top-3 text-slate-500 hover:text-slate-300">
                    {reqShowPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {reqError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{reqError}</div>
              )}

              <button type="submit" disabled={reqLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500 disabled:opacity-60 transition-all">
                {reqLoading ? <Spinner size="sm" /> : 'Send Request'}
              </button>

              <button type="button" onClick={() => setMode('login')}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/8 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all">
                <ArrowLeft className="h-4 w-4" /> Back to Sign In
              </button>
            </form>
          )}

          {/* ── REQUEST SUCCESS ── */}
          {mode === 'request' && reqSuccess && (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
                <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Request Sent!</h3>
                <p className="text-sm text-slate-500 mt-1">The admin will review your request and grant you access.</p>
              </div>
              <button onClick={() => { setMode('login'); setReqSuccess(false) }}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/8 py-2.5 text-sm text-slate-400 hover:bg-white/5 transition-all">
                <ArrowLeft className="h-4 w-4" /> Back to Sign In
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bot, Plus, Trash2, ChevronRight, ChevronDown, ChevronUp,
  Wallet, Building2, CreditCard, DollarSign, Server, KeyRound,
  BarChart2, X, CheckCircle2, Clock, FlaskConical, Archive
} from 'lucide-react'
import api from '@/lib/api'
import { useUIStore } from '@/store/uiStore'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'

type BotItem = {
  id: number; name: string; description: string | null
  tags: string | null; priority: number; status: string; created_at: string
  account_type?: string | null
  account_broker?: string | null
  broker_server?: string | null
  account_id?: string | null
  account_password?: string | null
  account_balance?: string | null
}

// ─── BOT OVERVIEW MODAL ─────────────────────────────
function BotOverviewModal({ bots, onClose }: { bots: BotItem[]; onClose: () => void }) {
  const total = bots.length
  const active = bots.filter(b => b.status === 'active').length
  const experimental = bots.filter(b => b.status === 'experimental').length
  const archived = bots.filter(b => b.status === 'archived').length

  const real = bots.filter(b => b.account_type === 'real').length
  const demo = bots.filter(b => b.account_type === 'demo').length
  const noAccount = bots.filter(b => !b.account_type).length

  const activeReal = bots.filter(b => b.status === 'active' && b.account_type === 'real').length
  const activeDemo = bots.filter(b => b.status === 'active' && b.account_type === 'demo').length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/8 bg-[#0d1424] shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-blue-400" /> Bot Overview
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5"><X className="h-4 w-4" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl border border-white/5 bg-white/2 p-3 text-center">
            <p className="text-2xl font-bold text-white">{total}</p>
            <p className="text-xs text-slate-500 mt-0.5">Total Bots</p>
          </div>
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-center">
            <p className="text-2xl font-bold text-blue-400">{active}</p>
            <p className="text-xs text-slate-500 mt-0.5">Active</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">By Status</p>
          {[
            { label: 'Active', value: active, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Experimental / Building', value: experimental, icon: FlaskConical, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'Archived', value: archived, icon: Archive, color: 'text-slate-400', bg: 'bg-white/5' },
          ].map(r => (
            <div key={r.label} className={`flex items-center gap-3 rounded-xl ${r.bg} border border-white/5 px-3 py-2.5`}>
              <r.icon className={`h-4 w-4 ${r.color} shrink-0`} />
              <span className="flex-1 text-sm text-slate-300">{r.label}</span>
              <span className={`text-lg font-bold ${r.color}`}>{r.value}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">By Account Type</p>
          {[
            { label: 'Real Account', value: real, sub: `${activeReal} active`, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Demo Account', value: demo, sub: `${activeDemo} active`, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'No Account Set', value: noAccount, sub: '', color: 'text-slate-400', bg: 'bg-white/5' },
          ].map(r => (
            <div key={r.label} className={`flex items-center gap-3 rounded-xl ${r.bg} border border-white/5 px-3 py-2.5`}>
              <div className="flex-1">
                <span className="text-sm text-slate-300">{r.label}</span>
                {r.sub && <span className="text-xs text-slate-600 ml-2">{r.sub}</span>}
              </div>
              <span className={`text-lg font-bold ${r.color}`}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── ACCOUNT DROPDOWN ────────────────────────────────
function AccountDropdown({ bot, onSave }: { bot: BotItem; onSave: (data: Partial<BotItem>) => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [accountType, setAccountType] = useState(bot.account_type || '')
  const [broker, setBroker] = useState(bot.account_broker || '')
  const [brokerServer, setBrokerServer] = useState(bot.broker_server || '')
  const [accountId, setAccountId] = useState(bot.account_id || '')
  const [password, setPassword] = useState(bot.account_password || '')
  const [showPassword, setShowPassword] = useState(false)
  const [balance, setBalance] = useState(bot.account_balance || '')
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.MouseEvent) {
    e.stopPropagation()
    setSaving(true)
    try {
      await onSave({
        account_type: accountType, account_broker: broker,
        broker_server: brokerServer, account_id: accountId,
        account_password: password, account_balance: balance,
      })
    } finally { setSaving(false) }
  }

  const serverHint = accountType === 'real'
    ? 'e.g. Exness-Real5, Blueberry-Live2'
    : 'e.g. Exness-Demo3, Blueberry-Demo1'

  return (
    <div className="mt-3 border-t border-white/5 pt-3" onClick={e => e.stopPropagation()}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        className="flex w-full items-center gap-2 rounded-xl border border-white/8 bg-white/3 px-3 py-2 text-xs text-slate-400 hover:bg-white/6 transition-all">
        <Wallet className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">
          {bot.account_type
            ? <>
                <span className={`font-semibold ${bot.account_type === 'real' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {bot.account_type === 'real' ? '🟢 Real' : '🟡 Demo'}
                </span>
                {bot.account_broker && <span className="ml-1 text-slate-500">· {bot.account_broker}</span>}
                {bot.broker_server && <span className="ml-1 text-slate-600">({bot.broker_server})</span>}
                {bot.account_balance && <span className="ml-1 text-slate-500">· ₹{bot.account_balance}</span>}
              </>
            : 'Set trading account...'}
        </span>
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-white/8 bg-[#0a0f1e] p-4 space-y-3">
          {/* Account type */}
          <div>
            <label className="block text-[10px] font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Account Type</label>
            <div className="flex gap-2">
              {['real', 'demo'].map(type => (
                <button key={type} onClick={() => setAccountType(type)}
                  className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-all ${
                    accountType === type
                      ? type === 'real' ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400' : 'border-amber-500/40 bg-amber-500/15 text-amber-400'
                      : 'border-white/8 text-slate-600 hover:border-white/15 hover:text-slate-400'
                  }`}>
                  {type === 'real' ? '🟢 Real Account' : '🟡 Demo Account'}
                </button>
              ))}
            </div>
          </div>

          {/* Broker */}
          <div>
            <label className="block text-[10px] font-medium text-slate-500 mb-1.5 uppercase tracking-wide flex items-center gap-1">
              <Building2 className="h-3 w-3" /> Broker Name
            </label>
            <input value={broker} onChange={e => setBroker(e.target.value)} placeholder="e.g. Exness, Blueberry, Zerodha"
              className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500/50" />
          </div>

          {/* Broker Server */}
          <div>
            <label className="block text-[10px] font-medium text-slate-500 mb-1.5 uppercase tracking-wide flex items-center gap-1">
              <Server className="h-3 w-3" /> Broker Server
            </label>
            <input value={brokerServer} onChange={e => setBrokerServer(e.target.value)} placeholder={serverHint}
              className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500/50" />
          </div>

          {/* Account ID */}
          <div>
            <label className="block text-[10px] font-medium text-slate-500 mb-1.5 uppercase tracking-wide flex items-center gap-1">
              <CreditCard className="h-3 w-3" /> Account / Client ID
            </label>
            <input value={accountId} onChange={e => setAccountId(e.target.value)} placeholder="Your client/account ID"
              className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500/50" />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] font-medium text-slate-500 mb-1.5 uppercase tracking-wide flex items-center gap-1">
              <KeyRound className="h-3 w-3" /> Account Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Trading account password"
                className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2 pr-16 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500/50" />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 hover:text-slate-300 px-1">
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Balance */}
          <div>
            <label className="block text-[10px] font-medium text-slate-500 mb-1.5 uppercase tracking-wide flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Allocated Balance (₹)
            </label>
            <input value={balance} onChange={e => setBalance(e.target.value)} placeholder="e.g. 50000"
              className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500/50" />
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full rounded-xl bg-blue-600/20 border border-blue-500/30 py-2 text-xs font-semibold text-blue-400 hover:bg-blue-600/30 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Account Details'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function BotsPage() {
  const router = useRouter()
  const { addToast } = useUIStore()
  const [bots, setBots] = useState<BotItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showOverview, setShowOverview] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', tags: '', status: 'active' })
  const [saving, setSaving] = useState(false)

  async function loadBots() {
    try {
      const { data } = await api.get('/api/bots/')
      setBots(data.sort((a: BotItem, b: BotItem) => a.priority - b.priority))
    } finally { setLoading(false) }
  }
  useEffect(() => { loadBots() }, [])

  async function createBot() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await api.post('/api/bots/', { ...form, priority: bots.length })
      addToast('Bot created!', 'success')
      setShowCreate(false)
      setForm({ name: '', description: '', tags: '', status: 'active' })
      loadBots()
    } catch { addToast('Failed to create bot', 'error') }
    finally { setSaving(false) }
  }

  async function deleteBot(id: number, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Delete this bot and all its data?')) return
    await api.delete(`/api/bots/${id}`)
    addToast('Bot deleted', 'info')
    loadBots()
  }

  async function movePriority(id: number, dir: -1 | 1, e: React.MouseEvent) {
    e.stopPropagation()
    const sorted = [...bots]
    const idx = sorted.findIndex(b => b.id === id)
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= sorted.length) return
    ;[sorted[idx], sorted[newIdx]] = [sorted[newIdx], sorted[idx]]
    await Promise.all(sorted.map((b, i) => api.patch(`/api/bots/${b.id}`, { priority: i })))
    loadBots()
  }

  async function updateBotAccount(id: number, data: Partial<BotItem>) {
    await api.patch(`/api/bots/${id}`, data)
    addToast('Account details saved!', 'success')
    loadBots()
  }

  const statusVariant = (s: string): 'success' | 'warning' | 'default' =>
    s === 'active' ? 'success' : s === 'experimental' ? 'warning' : 'default'

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Your Bots</h2>
          <p className="text-sm text-slate-500">Ranked by priority. Click to open details.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowOverview(true)}
            className="flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/3 px-3 py-2.5 text-sm text-slate-400 hover:bg-white/8 transition-all">
            <BarChart2 className="h-4 w-4" /> Overview
          </button>
          <button onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all">
            <Plus className="h-4 w-4" /> New Bot
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 space-y-3">
          <p className="text-sm font-semibold text-blue-300">Create New Bot</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input autoFocus placeholder="Bot name *" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && createBot()}
              className="rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20" />
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="rounded-xl border border-white/8 bg-[#0d1424] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/60">
              <option value="active">Active</option>
              <option value="experimental">Experimental (Building)</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <textarea placeholder="Description (optional)" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2} className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60 resize-none" />
          <input placeholder="Tags: trend, scalping, crypto" value={form.tags}
            onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60" />
          <div className="flex gap-2">
            <button onClick={createBot} disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
              {saving ? <Spinner size="sm" /> : null} Create
            </button>
            <button onClick={() => setShowCreate(false)}
              className="rounded-xl border border-white/8 px-4 py-2.5 text-sm text-slate-400 hover:bg-white/5">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : bots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-white/8">
          <Bot className="h-12 w-12 text-slate-700 mb-3" />
          <p className="text-slate-500 font-medium">No bots yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bots.map((bot, idx) => (
            <div key={bot.id}
              className="group rounded-2xl border border-white/5 bg-white/2 px-4 py-4 hover:border-blue-500/30 hover:bg-white/4 transition-all duration-150">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/dashboard/bots/${bot.id}`)}>
                <div className="flex flex-col items-center gap-0.5 w-6">
                  <button onClick={e => movePriority(bot.id, -1, e)} disabled={idx === 0}
                    className="text-slate-600 hover:text-slate-300 disabled:opacity-20 text-xs leading-none">▲</button>
                  <span className="text-xs font-bold text-slate-600 tabular-nums">{idx + 1}</span>
                  <button onClick={e => movePriority(bot.id, 1, e)} disabled={idx === bots.length - 1}
                    className="text-slate-600 hover:text-slate-300 disabled:opacity-20 text-xs leading-none">▼</button>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white truncate">{bot.name}</span>
                    <Badge variant={statusVariant(bot.status)}>{bot.status}</Badge>
                    {bot.account_type && (
                      <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 border ${
                        bot.account_type === 'real'
                          ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'
                          : 'bg-amber-500/15 border-amber-500/25 text-amber-400'
                      }`}>
                        {bot.account_type === 'real' ? '🟢 Real' : '🟡 Demo'}
                      </span>
                    )}
                    {bot.broker_server && (
                      <span className="text-[10px] text-slate-600 font-mono">{bot.broker_server}</span>
                    )}
                  </div>
                  {bot.description && <p className="text-xs text-slate-500 truncate mt-0.5">{bot.description}</p>}
                  {bot.tags && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {bot.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                        <span key={tag} className="rounded-full bg-white/5 border border-white/8 px-2 py-0.5 text-[10px] text-slate-400">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <button onClick={e => deleteBot(bot.id, e)}
                    className="rounded-xl p-2 text-slate-600 hover:bg-red-500/10 hover:text-red-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 shrink-0" />
              </div>
              <AccountDropdown bot={bot} onSave={(data) => updateBotAccount(bot.id, data)} />
            </div>
          ))}
        </div>
      )}

      {showOverview && <BotOverviewModal bots={bots} onClose={() => setShowOverview(false)} />}
    </div>
  )
}

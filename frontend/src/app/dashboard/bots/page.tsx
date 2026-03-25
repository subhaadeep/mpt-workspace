'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, Plus, Trash2, ChevronRight, Zap, Archive, FlaskConical } from 'lucide-react'
import api from '@/lib/api'
import { useUIStore } from '@/store/uiStore'
import DashboardShell from '@/components/layout/DashboardShell'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'

type BotItem = {
  id: number; name: string; description: string | null
  tags: string | null; priority: number; status: string; created_at: string
}

export default function BotsPage() {
  const router = useRouter()
  const { addToast } = useUIStore()
  const [bots, setBots] = useState<BotItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
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

  const statusVariant = (s: string) => s === 'active' ? 'success' : s === 'experimental' ? 'warning' : 'default'

  return (
    <DashboardShell title="Bots">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Your Bots</h2>
            <p className="text-sm text-slate-500">Ranked by priority. Click to open details.</p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all"
          >
            <Plus className="h-4 w-4" /> New Bot
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 space-y-3">
            <p className="text-sm font-semibold text-blue-300">Create New Bot</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                autoFocus
                placeholder="Bot name *"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && createBot()}
                className="rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
              />
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="rounded-xl border border-white/8 bg-[#0d1424] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/60"
              >
                <option value="active">Active</option>
                <option value="experimental">Experimental</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <textarea
              placeholder="Description (optional)"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60 resize-none"
            />
            <input
              placeholder="Tags: trend, scalping, crypto"
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60"
            />
            <div className="flex gap-2">
              <button onClick={createBot} disabled={saving} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
                {saving ? <Spinner size="sm" /> : null} Create
              </button>
              <button onClick={() => setShowCreate(false)} className="rounded-xl border border-white/8 px-4 py-2.5 text-sm text-slate-400 hover:bg-white/5">Cancel</button>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : bots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-white/8">
            <Bot className="h-12 w-12 text-slate-700 mb-3" />
            <p className="text-slate-500 font-medium">No bots yet</p>
            <p className="text-sm text-slate-600">Create your first bot to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bots.map((bot, idx) => (
              <div
                key={bot.id}
                onClick={() => router.push(`/dashboard/bots/${bot.id}`)}
                className="group flex items-center gap-3 rounded-2xl border border-white/5 bg-white/2 px-4 py-3.5 cursor-pointer hover:border-blue-500/30 hover:bg-white/4 transition-all duration-150"
              >
                {/* Rank */}
                <div className="flex flex-col items-center gap-0.5 w-6">
                  <button onClick={e => movePriority(bot.id, -1, e)} disabled={idx === 0}
                    className="text-slate-600 hover:text-slate-300 disabled:opacity-20 text-xs leading-none">▲</button>
                  <span className="text-xs font-bold text-slate-600 tabular-nums">{idx + 1}</span>
                  <button onClick={e => movePriority(bot.id, 1, e)} disabled={idx === bots.length - 1}
                    className="text-slate-600 hover:text-slate-300 disabled:opacity-20 text-xs leading-none">▼</button>
                </div>

                {/* Icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400">
                  <Bot className="h-5 w-5" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white truncate">{bot.name}</span>
                    <Badge variant={statusVariant(bot.status)}>{bot.status}</Badge>
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

                {/* Arrow + delete */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <button onClick={e => deleteBot(bot.id, e)}
                    className="rounded-xl p-2 text-slate-600 hover:bg-red-500/10 hover:text-red-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400" />
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, Plus, GripVertical, Star, Archive, FlaskConical, Pencil, Trash2, ChevronRight } from 'lucide-react'
import api from '@/lib/api'
import { useUIStore } from '@/store/uiStore'

type BotItem = {
  id: number
  name: string
  description: string | null
  tags: string | null
  priority: number
  status: string
  created_at: string
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  active:       <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />,
  archived:     <span className="h-2 w-2 rounded-full bg-slate-400 inline-block" />,
  experimental: <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />,
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

  async function deleteBot(id: number) {
    if (!confirm('Delete this bot and all its versions?')) return
    await api.delete(`/api/bots/${id}`)
    addToast('Bot deleted', 'info')
    loadBots()
  }

  async function movePriority(id: number, dir: -1 | 1) {
    const sorted = [...bots]
    const idx = sorted.findIndex(b => b.id === id)
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= sorted.length) return
    // swap
    ;[sorted[idx], sorted[newIdx]] = [sorted[newIdx], sorted[idx]]
    // update priorities
    const updates = sorted.map((b, i) => api.patch(`/api/bots/${b.id}`, { priority: i }))
    await Promise.all(updates)
    loadBots()
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Bots</h2>
          <p className="text-sm text-slate-500">Drag to re-rank. Click a bot to open its full details.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> New Bot
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
          <p className="font-medium text-slate-800">Create New Bot</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Bot name *"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
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
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <input
            placeholder="Tags (comma-separated): trend, scalping, crypto"
            value={form.tags}
            onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <div className="flex gap-2">
            <button onClick={createBot} disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Creating...' : 'Create'}
            </button>
            <button onClick={() => setShowCreate(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100">Cancel</button>
          </div>
        </div>
      )}

      {/* Bot list */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading bots...</div>
      ) : bots.length === 0 ? (
        <div className="text-center py-16 rounded-xl border-2 border-dashed border-slate-200">
          <Bot className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No bots yet</p>
          <p className="text-sm text-slate-400">Create your first bot to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bots.map((bot, idx) => (
            <div
              key={bot.id}
              className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              onClick={() => router.push(`/dashboard/bots/${bot.id}`)}
            >
              {/* Rank badge */}
              <div className="flex flex-col items-center gap-0.5">
                <button
                  onClick={e => { e.stopPropagation(); movePriority(bot.id, -1) }}
                  disabled={idx === 0}
                  className="text-slate-300 hover:text-slate-600 disabled:opacity-20 text-xs leading-none"
                >▲</button>
                <span className="text-xs font-bold text-slate-400 w-5 text-center">{idx + 1}</span>
                <button
                  onClick={e => { e.stopPropagation(); movePriority(bot.id, 1) }}
                  disabled={idx === bots.length - 1}
                  className="text-slate-300 hover:text-slate-600 disabled:opacity-20 text-xs leading-none"
                >▼</button>
              </div>

              {/* Icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                <Bot className="h-5 w-5 text-blue-600" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 truncate">{bot.name}</span>
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    {STATUS_ICON[bot.status] ?? STATUS_ICON.active}
                    <span className="capitalize">{bot.status}</span>
                  </span>
                </div>
                {bot.description && <p className="text-sm text-slate-500 truncate mt-0.5">{bot.description}</p>}
                {bot.tags && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {bot.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                      <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => router.push(`/dashboard/bots/${bot.id}`)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                  title="Open"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteBot(bot.id)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

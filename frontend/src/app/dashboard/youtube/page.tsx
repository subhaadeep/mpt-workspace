'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, X, ChevronRight, Trash2, ExternalLink, FileText, Film,
  Scissors, Image, Upload, Tag, Youtube, Archive, BarChart2,
  Activity, ChevronDown, Tv2
} from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'

type VideoStatus = 'script' | 'raw_files' | 'editing' | 'thumbnail' | 'queue' | 'uploaded'

type Video = {
  id: number; title: string; idea_description?: string; script?: string
  status: VideoStatus; tags?: string; youtube_url?: string
  channel_id?: number; created_at: string
}

type Channel = { id: number; name: string; description?: string; youtube_handle?: string }

type ActivityLog = {
  id: number; video_title: string; action: string
  from_status?: string; to_status?: string
  done_by_name?: string; created_at: string
}

type DeletedVideo = {
  id: number; title: string; status_at_deletion?: string
  deleted_by_name?: string; deleted_at: string; tags?: string
}

type YtStats = { total: number; by_status: Record<string, number>; deleted: number }

const STAGES: {
  key: VideoStatus; label: string; icon: React.ElementType
  color: string; bg: string; border: string; dot: string
}[] = [
  { key: 'script',    label: 'Script',    icon: FileText, color: 'text-violet-400', bg: 'bg-violet-500/10',  border: 'border-violet-500/25', dot: 'bg-violet-400' },
  { key: 'raw_files', label: 'Raw Files', icon: Film,     color: 'text-blue-400',   bg: 'bg-blue-500/10',    border: 'border-blue-500/25',   dot: 'bg-blue-400' },
  { key: 'editing',   label: 'Editing',   icon: Scissors, color: 'text-amber-400',  bg: 'bg-amber-500/10',   border: 'border-amber-500/25',  dot: 'bg-amber-400' },
  { key: 'thumbnail', label: 'Thumbnail', icon: Image,    color: 'text-pink-400',   bg: 'bg-pink-500/10',    border: 'border-pink-500/25',   dot: 'bg-pink-400' },
  { key: 'queue',     label: 'Queue',     icon: Archive,  color: 'text-cyan-400',   bg: 'bg-cyan-500/10',    border: 'border-cyan-500/25',   dot: 'bg-cyan-400' },
  { key: 'uploaded',  label: 'Uploaded',  icon: Upload,   color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', dot: 'bg-emerald-400' },
]

const NEXT_STATUS: Record<VideoStatus, VideoStatus | null> = {
  script: 'raw_files', raw_files: 'editing', editing: 'thumbnail',
  thumbnail: 'queue', queue: 'uploaded', uploaded: null
}

const STATUS_COLOR: Record<string, string> = {
  script: 'text-violet-400', raw_files: 'text-blue-400', editing: 'text-amber-400',
  thumbnail: 'text-pink-400', queue: 'text-cyan-400', uploaded: 'text-emerald-400',
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function StatusPill({ status }: { status: VideoStatus }) {
  const s = STAGES.find(x => x.key === status)!
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${s.bg} ${s.color} ${s.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

function VideoDrawer({ video, onClose }: { video: Video; onClose: () => void }) {
  const qc = useQueryClient()
  const { addToast, addPipelineNotification } = useUIStore()
  const [title, setTitle] = useState(video.title)
  const [desc, setDesc] = useState(video.idea_description || '')
  const [script, setScript] = useState(video.script || '')
  const [tags, setTags] = useState(video.tags || '')
  const [ytUrl, setYtUrl] = useState(video.youtube_url || '')
  const [tab, setTab] = useState<'info' | 'script'>('info')

  const update = useMutation({
    mutationFn: (payload: Partial<Video>) =>
      api.patch(`/api/youtube/${video.id}`, payload).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['videos'] }); addToast('Saved!', 'success') },
    onError: () => addToast('Save failed', 'error'),
  })

  const advance = useMutation({
    mutationFn: (newStatus: VideoStatus) =>
      api.patch(`/api/youtube/${video.id}`, { status: newStatus }).then(r => r.data),
    onSuccess: (data: Video) => {
      qc.invalidateQueries({ queryKey: ['videos'] })
      qc.invalidateQueries({ queryKey: ['youtube-activity'] })
      qc.invalidateQueries({ queryKey: ['youtube-stats'] })
      const toLabel = STAGES.find(s => s.key === data.status)?.label || data.status
      addToast(`Moved to ${toLabel}! ✓`, 'success')
      addPipelineNotification(video.title, video.status, data.status)
      onClose()
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      addToast(msg || 'Failed to move stage', 'error')
    },
  })

  const del = useMutation({
    mutationFn: () => api.delete(`/api/youtube/${video.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['videos'] })
      qc.invalidateQueries({ queryKey: ['youtube-deleted'] })
      qc.invalidateQueries({ queryKey: ['youtube-activity'] })
      qc.invalidateQueries({ queryKey: ['youtube-stats'] })
      addToast('Deleted', 'info'); onClose()
    },
    onError: () => addToast('Failed to delete', 'error'),
  })

  const nextStatus = NEXT_STATUS[video.status]
  const nextStage = nextStatus ? STAGES.find(s => s.key === nextStatus) : null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto flex h-full w-full max-w-lg flex-col bg-[#0d1424] border-l border-white/8 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/5 px-6 py-4">
          <div className="min-w-0">
            <StatusPill status={video.status} />
            <h2 className="mt-2 text-lg font-semibold text-white truncate">{video.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Created {formatDate(video.created_at)}</p>
          </div>
          <button onClick={onClose} className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex border-b border-white/5 px-4 py-2 gap-1 overflow-x-auto">
          {STAGES.map((s, i) => {
            const isPast = STAGES.findIndex(x => x.key === video.status) > i
            const isCurrent = s.key === video.status
            return (
              <div key={s.key} className="flex items-center gap-1">
                <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium ${
                  isCurrent ? `${s.bg} ${s.color} border ${s.border}` :
                  isPast ? 'bg-white/5 text-slate-500' : 'text-slate-700'
                }`}>
                  <s.icon className="h-3 w-3" />
                  {s.label}
                </div>
                {i < STAGES.length - 1 && <ChevronRight className="h-3 w-3 text-slate-700 shrink-0" />}
              </div>
            )
          })}
        </div>

        <div className="flex border-b border-white/5 px-6">
          {(['info', 'script'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium capitalize transition ${
                tab === t ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}>
              {t === 'info' ? 'Details' : 'Script'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {tab === 'info' ? (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Idea / Description</label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3}
                  className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/60 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5"><Tag className="inline h-3 w-3 mr-1" />Tags</label>
                <input value={tags} onChange={e => setTags(e.target.value)} placeholder="shorts, nifty, analysis"
                  className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/60" />
              </div>
              {video.status === 'uploaded' && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">YouTube URL</label>
                  <input value={ytUrl} onChange={e => setYtUrl(e.target.value)}
                    className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/60" />
                </div>
              )}
            </>
          ) : (
            <textarea value={script} onChange={e => setScript(e.target.value)} rows={20} placeholder="Write your script here..."
              className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/60 resize-none" />
          )}
        </div>

        <div className="border-t border-white/5 px-6 py-4 space-y-2">
          {nextStage && (
            <button onClick={() => advance.mutate(nextStatus!)} disabled={advance.isPending}
              className={`w-full flex items-center justify-center gap-2 rounded-xl border ${nextStage.border} ${nextStage.bg} py-3 text-sm font-semibold ${nextStage.color} hover:opacity-80 disabled:opacity-50`}>
              {advance.isPending ? <><Spinner size="sm" /> Moving...</> : <><ChevronRight className="h-4 w-4" /> Move to {nextStage.label}</>}
            </button>
          )}
          {video.status === 'uploaded' && video.youtube_url && (
            <a href={video.youtube_url} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-xl border border-red-500/25 bg-red-500/10 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/20">
              <ExternalLink className="h-4 w-4" /> View on YouTube
            </a>
          )}
          <button onClick={() => update.mutate({ title, idea_description: desc, script, tags, youtube_url: ytUrl })} disabled={update.isPending}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/8 bg-white/4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/8 disabled:opacity-50">
            {update.isPending ? <Spinner size="sm" /> : null} Save Changes
          </button>
          <button onClick={() => { if (window.confirm(`Delete "${video.title}"? It will be saved in the deleted archive.`)) del.mutate() }}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2 text-sm text-red-500 hover:bg-red-500/10">
            <Trash2 className="h-3.5 w-3.5" /> Delete Video
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── OVERVIEW MODAL ────────────────────────────────────────────────────────
function StatsModal({ stats, onClose }: { stats: YtStats; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/8 bg-[#0d1424] shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-red-400" /> YouTube Overview
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl border border-white/5 bg-white/2 p-3 text-center">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-slate-500 mt-0.5">Total Videos</p>
          </div>
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{stats.deleted}</p>
            <p className="text-xs text-slate-500 mt-0.5">Deleted (archived)</p>
          </div>
        </div>
        <div className="space-y-2">
          {STAGES.map(s => {
            const count = stats.by_status[s.key] ?? 0
            const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
            return (
              <div key={s.key} className="flex items-center gap-3">
                <s.icon className={`h-3.5 w-3.5 shrink-0 ${s.color}`} />
                <span className={`text-xs w-20 ${s.color}`}>{s.label}</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/5">
                  <div className={`h-full rounded-full ${s.dot}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-bold text-white w-5 text-right">{count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function YoutubePage() {
  const qc = useQueryClient()
  const { addToast } = useUIStore()
  const user = useAuthStore(s => s.user)
  const [selected, setSelected] = useState<Video | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showActivity, setShowActivity] = useState(false)
  const [showDeleted, setShowDeleted] = useState(false)
  const [showNewChannel, setShowNewChannel] = useState(false)
  const [activeChannelId, setActiveChannelId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'pipeline' | 'activity' | 'deleted'>('pipeline')
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newTags, setNewTags] = useState('')
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelHandle, setNewChannelHandle] = useState('')

  const { data: channels = [] } = useQuery<Channel[]>({
    queryKey: ['youtube-channels'],
    queryFn: () => api.get('/api/youtube/channels/').then(r => r.data),
  })

  const { data: videos = [], isLoading } = useQuery<Video[]>({
    queryKey: ['videos', activeChannelId],
    queryFn: () => {
      const params = activeChannelId ? `?channel_id=${activeChannelId}` : ''
      return api.get(`/api/youtube/${params}`).then(r => r.data)
    },
  })

  const { data: stats } = useQuery<YtStats>({
    queryKey: ['youtube-stats'],
    queryFn: () => api.get('/api/youtube/stats').then(r => r.data),
    enabled: !!(user?.is_admin || user?.can_access_youtube),
  })

  const { data: activity = [] } = useQuery<ActivityLog[]>({
    queryKey: ['youtube-activity'],
    queryFn: () => api.get('/api/youtube/activity').then(r => r.data),
  })

  const { data: deleted = [] } = useQuery<DeletedVideo[]>({
    queryKey: ['youtube-deleted'],
    queryFn: () => api.get('/api/youtube/deleted').then(r => r.data),
  })

  const createChannelMutation = useMutation({
    mutationFn: (d: object) => api.post('/api/youtube/channels/', d).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['youtube-channels'] })
      addToast('Channel created!', 'success')
      setShowNewChannel(false); setNewChannelName(''); setNewChannelHandle('')
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      addToast(msg ?? 'Failed to create channel', 'error')
    },
  })

  const createMutation = useMutation({
    mutationFn: (payload: object) => api.post('/api/youtube/', payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['videos'] })
      qc.invalidateQueries({ queryKey: ['youtube-stats'] })
      addToast('Video added!', 'success')
      setShowCreate(false); setNewTitle(''); setNewDesc(''); setNewTags('')
    },
    onError: () => addToast('Failed to create video', 'error'),
  })

  const byStatus = STAGES.reduce(
    (acc, s) => ({ ...acc, [s.key]: videos.filter(v => v.status === s.key) }),
    {} as Record<VideoStatus, Video[]>
  )

  const activeChannel = channels.find(c => c.id === activeChannelId)

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-400" /> YouTube Pipeline
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {videos.length} video{videos.length !== 1 ? 's' : ''}
            {activeChannel ? ` · ${activeChannel.name}` : ' · All Channels'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Overview button */}
          {stats && (
            <button onClick={() => setShowStats(true)}
              className="flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/3 px-3 py-2 text-xs text-slate-400 hover:bg-white/8 transition-all">
              <BarChart2 className="h-3.5 w-3.5" /> Overview
            </button>
          )}
          {/* Activity button */}
          <button onClick={() => setActiveTab(t => t === 'activity' ? 'pipeline' : 'activity')}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs transition-all ${
              activeTab === 'activity' ? 'border-blue-500/40 bg-blue-500/10 text-blue-400' : 'border-white/8 bg-white/3 text-slate-400 hover:bg-white/8'
            }`}>
            <Activity className="h-3.5 w-3.5" /> Activity
          </button>
          {/* Deleted archive button */}
          <button onClick={() => setActiveTab(t => t === 'deleted' ? 'pipeline' : 'deleted')}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs transition-all ${
              activeTab === 'deleted' ? 'border-red-500/40 bg-red-500/10 text-red-400' : 'border-white/8 bg-white/3 text-slate-400 hover:bg-white/8'
            }`}>
            <Trash2 className="h-3.5 w-3.5" /> Deleted
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all">
            <Plus className="h-4 w-4" /> New Video
          </button>
        </div>
      </div>

      {/* Channel selector row */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto flex-shrink-0 pb-1">
        <Tv2 className="h-4 w-4 text-slate-500 shrink-0" />
        <button
          onClick={() => setActiveChannelId(null)}
          className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${
            activeChannelId === null ? 'border-white/20 bg-white/8 text-white' : 'border-white/5 text-slate-500 hover:border-white/15 hover:text-slate-300'
          }`}>
          All
        </button>
        {channels.map(ch => (
          <button key={ch.id}
            onClick={() => setActiveChannelId(ch.id)}
            className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${
              activeChannelId === ch.id ? 'border-red-500/40 bg-red-500/10 text-red-300' : 'border-white/5 text-slate-500 hover:border-white/15 hover:text-slate-300'
            }`}>
            {ch.name}
            {ch.youtube_handle && <span className="ml-1 opacity-60">{ch.youtube_handle}</span>}
          </button>
        ))}
        {user?.is_admin && (
          <button onClick={() => setShowNewChannel(true)}
            className="shrink-0 flex items-center gap-1 rounded-xl border border-dashed border-white/10 px-3 py-1.5 text-xs text-slate-600 hover:border-white/25 hover:text-slate-400 transition-all">
            <Plus className="h-3 w-3" /> Channel
          </button>
        )}
      </div>

      {/* Pipeline summary bar */}
      {activeTab === 'pipeline' && (
        <div className="mb-4 grid grid-cols-6 rounded-2xl overflow-hidden border border-white/8 flex-shrink-0">
          {STAGES.map(s => {
            const count = byStatus[s.key]?.length ?? 0
            return (
              <div key={s.key} className={`flex flex-col items-center py-3 gap-1 ${s.bg} border-r border-white/5 last:border-r-0`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className={`text-lg font-bold ${s.color}`}>{count}</span>
                <span className={`text-[10px] font-medium ${s.color} opacity-80 hidden sm:block`}>{s.label}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* ── PIPELINE TAB ── */}
      {activeTab === 'pipeline' && (
        isLoading ? (
          <div className="flex flex-1 items-center justify-center"><Spinner size="lg" /></div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-0">
            {STAGES.map(s => {
              const cols = byStatus[s.key] ?? []
              return (
                <div key={s.key} className="flex flex-col min-w-[240px] max-w-[260px] flex-shrink-0">
                  <div className={`flex items-center gap-2 rounded-t-2xl border ${s.border} ${s.bg} px-4 py-3`}>
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                    <span className={`text-sm font-semibold ${s.color}`}>{s.label}</span>
                    {s.key === 'queue' && <span className="text-[9px] text-cyan-600 ml-0.5">(ready to upload)</span>}
                    <span className={`ml-auto flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${s.bg} ${s.color} border ${s.border}`}>{cols.length}</span>
                  </div>
                  <div className={`flex flex-col gap-3 rounded-b-2xl border-x border-b ${s.border} bg-white/2 p-3 flex-1 min-h-[180px]`}>
                    {cols.length === 0 && (
                      <div className="flex flex-col items-center justify-center flex-1 py-8">
                        <s.icon className={`h-8 w-8 ${s.color} opacity-20 mb-2`} />
                        <p className="text-xs text-slate-600">No videos</p>
                      </div>
                    )}
                    {cols.map(v => (
                      <button key={v.id} onClick={() => setSelected(v)}
                        className="group w-full rounded-xl border border-white/8 bg-[#0d1424] p-4 text-left hover:border-white/20 hover:bg-white/4 transition-all">
                        <p className="text-sm font-medium text-white line-clamp-2">{v.title}</p>
                        {v.idea_description && <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">{v.idea_description}</p>}
                        {v.tags && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {v.tags.split(',').slice(0, 3).map(t => (
                              <span key={t} className="rounded-full bg-white/5 border border-white/8 px-2 py-0.5 text-[10px] text-slate-500">{t.trim()}</span>
                            ))}
                          </div>
                        )}
                        <p className="mt-2 text-xs text-slate-600">{formatDate(v.created_at)}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* ── ACTIVITY TAB ── */}
      {activeTab === 'activity' && (
        <div className="flex-1 overflow-y-auto space-y-1">
          {activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-600">
              <Activity className="h-10 w-10 mb-3 opacity-20" />
              <p>No activity yet</p>
            </div>
          ) : activity.map(log => (
            <div key={log.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/3 transition-all">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                log.action === 'deleted' ? 'bg-red-500/10' : log.action === 'created' ? 'bg-emerald-500/10' : 'bg-blue-500/10'
              }`}>
                {log.action === 'deleted' ? <Trash2 className="h-3.5 w-3.5 text-red-400" /> :
                 log.action === 'created' ? <FileText className="h-3.5 w-3.5 text-emerald-400" /> :
                 <ChevronRight className="h-3.5 w-3.5 text-blue-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-slate-300 font-medium truncate block">{log.video_title}</span>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className={`text-xs font-medium ${
                    log.action === 'deleted' ? 'text-red-400' : log.action === 'created' ? 'text-emerald-400' : 'text-blue-400'
                  }`}>{log.action}</span>
                  {log.from_status && log.to_status && (
                    <>
                      <span className={`text-[10px] ${STATUS_COLOR[log.from_status] || 'text-slate-500'}`}>{log.from_status.replace('_', ' ')}</span>
                      <ChevronRight className="h-2.5 w-2.5 text-slate-600" />
                      <span className={`text-[10px] ${STATUS_COLOR[log.to_status] || 'text-slate-500'}`}>{log.to_status.replace('_', ' ')}</span>
                    </>
                  )}
                  {log.done_by_name && <span className="text-[10px] text-slate-600">by {log.done_by_name}</span>}
                </div>
              </div>
              <span className="text-[10px] text-slate-600 shrink-0">{timeAgo(log.created_at)}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── DELETED TAB ── */}
      {activeTab === 'deleted' && (
        <div className="flex-1 overflow-y-auto space-y-2">
          {deleted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-600">
              <Trash2 className="h-10 w-10 mb-3 opacity-20" />
              <p>No deleted videos</p>
            </div>
          ) : deleted.map(d => (
            <div key={d.id} className="rounded-2xl border border-red-500/15 bg-red-500/5 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-300 truncate">{d.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {d.status_at_deletion && (
                      <span className={`text-[10px] font-medium ${STATUS_COLOR[d.status_at_deletion] || 'text-slate-500'}`}>
                        was in: {d.status_at_deletion.replace('_', ' ')}
                      </span>
                    )}
                    {d.tags && <span className="text-[10px] text-slate-600">{d.tags}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-red-400">{d.deleted_by_name}</p>
                  <p className="text-[10px] text-slate-600">{timeAgo(d.deleted_at)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── DRAWERS & MODALS ── */}
      {selected && <VideoDrawer video={selected} onClose={() => setSelected(null)} />}
      {showStats && stats && <StatsModal stats={stats} onClose={() => setShowStats(false)} />}

      {/* New channel modal (admin only) */}
      {showNewChannel && user?.is_admin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNewChannel(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-white/8 bg-[#0d1424] shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">New Channel</h3>
            <div className="space-y-3">
              <input autoFocus placeholder="Channel name *" value={newChannelName} onChange={e => setNewChannelName(e.target.value)}
                className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60" />
              <input placeholder="YouTube handle (e.g. @mychannel)" value={newChannelHandle} onChange={e => setNewChannelHandle(e.target.value)}
                className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => createChannelMutation.mutate({ name: newChannelName, youtube_handle: newChannelHandle })} disabled={!newChannelName.trim() || createChannelMutation.isPending}
                className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
                {createChannelMutation.isPending ? 'Creating...' : 'Create'}
              </button>
              <button onClick={() => setShowNewChannel(false)} className="rounded-xl border border-white/8 px-4 py-2.5 text-sm text-slate-400">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* New video modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-white/8 bg-[#0d1424] shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">Add New Video</h3>
              <button onClick={() => setShowCreate(false)} className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={e => {
              e.preventDefault()
              createMutation.mutate({
                title: newTitle.trim(), idea_description: newDesc, tags: newTags,
                status: 'script', channel_id: activeChannelId ?? undefined,
              })
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Video Title *</label>
                <input autoFocus required value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. How I built a Nifty breakout bot"
                  className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Channel</label>
                <select value={activeChannelId ?? ''} onChange={e => setActiveChannelId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-xl border border-white/8 bg-[#0d1424] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/60">
                  <option value="">No channel</option>
                  {channels.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Idea / Description</label>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={2}
                  className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/60 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Tags</label>
                <input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="shorts, trading, nifty50"
                  className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/60" />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="rounded-xl border border-white/8 px-4 py-2 text-sm text-slate-400 hover:bg-white/5">Cancel</button>
                <button type="submit" disabled={createMutation.isPending}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
                  {createMutation.isPending ? <Spinner size="sm" /> : null} Add Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

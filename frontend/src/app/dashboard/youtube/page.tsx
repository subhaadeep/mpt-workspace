'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, ChevronRight, Trash2, ExternalLink, FileText, Film, Scissors, Image, Upload, Tag, Youtube } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { useUIStore } from '@/store/uiStore'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'

type VideoStatus = 'script' | 'raw_files' | 'editing' | 'thumbnail' | 'uploaded'

type Video = {
  id: number
  title: string
  idea_description?: string
  script?: string
  status: VideoStatus
  tags?: string
  youtube_url?: string
  created_at: string
}

const STAGES: {
  key: VideoStatus; label: string; icon: React.ElementType
  color: string; bg: string; border: string; dot: string
}[] = [
  { key: 'script',    label: 'Script',    icon: FileText, color: 'text-violet-400', bg: 'bg-violet-500/10',  border: 'border-violet-500/25', dot: 'bg-violet-400' },
  { key: 'raw_files', label: 'Raw Files', icon: Film,     color: 'text-blue-400',   bg: 'bg-blue-500/10',    border: 'border-blue-500/25',   dot: 'bg-blue-400' },
  { key: 'editing',   label: 'Editing',   icon: Scissors, color: 'text-amber-400',  bg: 'bg-amber-500/10',   border: 'border-amber-500/25',  dot: 'bg-amber-400' },
  { key: 'thumbnail', label: 'Thumbnail', icon: Image,    color: 'text-pink-400',   bg: 'bg-pink-500/10',    border: 'border-pink-500/25',   dot: 'bg-pink-400' },
  { key: 'uploaded',  label: 'Uploaded',  icon: Upload,   color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', dot: 'bg-emerald-400' },
]

const NEXT_STATUS: Record<VideoStatus, VideoStatus | null> = {
  script: 'raw_files', raw_files: 'editing', editing: 'thumbnail', thumbnail: 'uploaded', uploaded: null
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
      const fromLabel = STAGES.find(s => s.key === video.status)?.label || video.status
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['videos'] }); addToast('Deleted', 'info'); onClose() },
  })

  const nextStatus = NEXT_STATUS[video.status]
  const nextStage = nextStatus ? STAGES.find(s => s.key === nextStatus) : null
  const currentStage = STAGES.find(s => s.key === video.status)!

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto flex h-full w-full max-w-lg flex-col bg-[#0d1424] border-l border-white/8 shadow-2xl">
        {/* Header */}
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

        {/* Pipeline progress inside drawer */}
        <div className="flex border-b border-white/5 px-4 py-2 gap-1 overflow-x-auto">
          {STAGES.map((s, i) => {
            const isPast = STAGES.findIndex(x => x.key === video.status) > i
            const isCurrent = s.key === video.status
            return (
              <div key={s.key} className="flex items-center gap-1">
                <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium transition-all ${
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

        {/* Tabs */}
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {tab === 'info' ? (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Idea / Description</label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3}
                  className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  <Tag className="inline h-3 w-3 mr-1" />Tags
                </label>
                <input value={tags} onChange={e => setTags(e.target.value)} placeholder="shorts, nifty, analysis"
                  className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60" />
              </div>
              {video.status === 'uploaded' && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">YouTube URL</label>
                  <input value={ytUrl} onChange={e => setYtUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..."
                    className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60" />
                </div>
              )}
            </>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Script / Content</label>
              <textarea value={script} onChange={e => setScript(e.target.value)} rows={20} placeholder="Write your script here..."
                className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60 resize-none" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/5 px-6 py-4 space-y-2">
          {nextStage && (
            <button
              onClick={() => { if (!advance.isPending) advance.mutate(nextStatus!) }}
              disabled={advance.isPending}
              className={`w-full flex items-center justify-center gap-2 rounded-xl border ${nextStage.border} ${nextStage.bg} py-3 text-sm font-semibold ${nextStage.color} hover:opacity-80 disabled:opacity-50 transition-all cursor-pointer`}>
              {advance.isPending
                ? <><Spinner size="sm" /> Moving...</>
                : <><ChevronRight className="h-4 w-4" /> Move to {nextStage.label}</>}
            </button>
          )}
          {video.status === 'uploaded' && video.youtube_url && (
            <a href={video.youtube_url} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-xl border border-red-500/25 bg-red-500/10 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/20">
              <ExternalLink className="h-4 w-4" /> View on YouTube
            </a>
          )}
          <button
            onClick={() => update.mutate({ title, idea_description: desc, script, tags, youtube_url: ytUrl })}
            disabled={update.isPending}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/8 bg-white/4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/8 disabled:opacity-50 transition-all">
            {update.isPending ? <Spinner size="sm" /> : null} Save Changes
          </button>
          <button onClick={() => del.mutate()}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2 text-sm text-red-500 hover:bg-red-500/10 transition-all">
            <Trash2 className="h-3.5 w-3.5" /> Delete Video
          </button>
        </div>
      </div>
    </div>
  )
}

export default function YoutubePage() {
  const qc = useQueryClient()
  const addToast = useUIStore(s => s.addToast)
  const [selected, setSelected] = useState<Video | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newTags, setNewTags] = useState('')

  const { data: videos = [], isLoading } = useQuery<Video[]>({
    queryKey: ['videos'],
    queryFn: () => api.get('/api/youtube/').then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (payload: object) => api.post('/api/youtube/', payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['videos'] })
      addToast('Video added!', 'success')
      setShowCreate(false); setNewTitle(''); setNewDesc(''); setNewTags('')
    },
    onError: () => addToast('Failed to create video', 'error'),
  })

  const byStatus = STAGES.reduce(
    (acc, s) => ({ ...acc, [s.key]: videos.filter(v => v.status === s.key) }),
    {} as Record<VideoStatus, Video[]>
  )

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-400" /> YouTube Pipeline
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {videos.length} video{videos.length !== 1 ? 's' : ''} across {STAGES.length} stages
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all">
          <Plus className="h-4 w-4" /> New Video
        </button>
      </div>

      {/* Pipeline summary bar */}
      <div className="mb-5 grid grid-cols-5 rounded-2xl overflow-hidden border border-white/8 flex-shrink-0">
        {STAGES.map(s => {
          const count = byStatus[s.key]?.length ?? 0
          const Icon = s.icon
          return (
            <div key={s.key} className={`flex flex-col items-center py-3 gap-1 ${s.bg} border-r border-white/5 last:border-r-0`}>
              <Icon className={`h-4 w-4 ${s.color}`} />
              <span className={`text-lg font-bold ${s.color}`}>{count}</span>
              <span className={`text-[10px] font-medium ${s.color} opacity-80`}>{s.label}</span>
            </div>
          )
        })}
      </div>

      {/* Kanban board */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center"><Spinner size="lg" /></div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-0">
          {STAGES.map(s => {
            const Icon = s.icon
            const cols = byStatus[s.key] ?? []
            return (
              <div key={s.key} className="flex flex-col min-w-[240px] max-w-[260px] flex-shrink-0">
                <div className={`flex items-center gap-2 rounded-t-2xl border ${s.border} ${s.bg} px-4 py-3`}>
                  <Icon className={`h-4 w-4 ${s.color}`} />
                  <span className={`text-sm font-semibold ${s.color}`}>{s.label}</span>
                  <span className={`ml-auto flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${s.bg} ${s.color} border ${s.border}`}>
                    {cols.length}
                  </span>
                </div>
                <div className={`flex flex-col gap-3 rounded-b-2xl border-x border-b ${s.border} bg-white/2 p-3 flex-1 min-h-[180px]`}>
                  {cols.length === 0 && (
                    <div className="flex flex-col items-center justify-center flex-1 py-8">
                      <Icon className={`h-8 w-8 ${s.color} opacity-20 mb-2`} />
                      <p className="text-xs text-slate-600">No videos</p>
                    </div>
                  )}
                  {cols.map(v => (
                    <button key={v.id} onClick={() => setSelected(v)}
                      className="group w-full rounded-xl border border-white/8 bg-[#0d1424] p-4 text-left hover:border-white/20 hover:bg-white/4 transition-all">
                      <p className="text-sm font-medium text-white line-clamp-2">{v.title}</p>
                      {v.idea_description && (
                        <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">{v.idea_description}</p>
                      )}
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
      )}

      {selected && <VideoDrawer video={selected} onClose={() => setSelected(null)} />}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-white/8 bg-[#0d1424] shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">Add New Video</h3>
              <button onClick={() => setShowCreate(false)} className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={e => {
              e.preventDefault()
              createMutation.mutate({ title: newTitle.trim(), idea_description: newDesc, tags: newTags, status: 'script' })
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Video Title *</label>
                <input autoFocus required value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. How I built a Nifty breakout bot"
                  className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Idea / Description</label>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3}
                  placeholder="What is this video about?"
                  className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Tags</label>
                <input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="shorts, trading, nifty50"
                  className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60" />
              </div>
              <p className="text-xs text-slate-600">Starts in <span className="text-violet-400">Script</span> stage.</p>
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

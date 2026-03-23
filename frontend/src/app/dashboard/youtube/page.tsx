'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, X, ChevronRight, Trash2, ExternalLink,
  FileText, Film, Scissors, Image, Upload, Tag
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { useUIStore } from '@/store/uiStore'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import {
  VIDEO_STATUSES,
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_NEXT,
  type VideoStatus,
} from '@/lib/constants'

// ─── Types ────────────────────────────────────────────────────────────────────
type Video = {
  id: number
  title: string
  idea_description?: string
  script?: string
  status: VideoStatus
  tags?: string
  youtube_url?: string
  scheduled_date?: string
  uploaded_date?: string
  created_at: string
  updated_at?: string
}

// ─── Stage icons ──────────────────────────────────────────────────────────────
const STAGE_ICONS: Record<VideoStatus, React.ElementType> = {
  script:    FileText,
  raw_files: Film,
  editing:   Scissors,
  thumbnail: Image,
  uploaded:  Upload,
}

// ─── Status pill ──────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: VideoStatus }) {
  const c = STATUS_COLORS[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {STATUS_LABELS[status]}
    </span>
  )
}

// ─── Video detail drawer ───────────────────────────────────────────────────────
function VideoDrawer({
  video,
  onClose,
}: {
  video: Video
  onClose: () => void
}) {
  const qc = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)
  const [script, setScript] = useState(video.script || '')
  const [title, setTitle] = useState(video.title)
  const [desc, setDesc] = useState(video.idea_description || '')
  const [tags, setTags] = useState(video.tags || '')
  const [ytUrl, setYtUrl] = useState(video.youtube_url || '')
  const [tab, setTab] = useState<'info' | 'script'>('info')

  const update = useMutation({
    mutationFn: (payload: Partial<Video>) =>
      api.patch(`/api/youtube/videos/${video.id}`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['videos'] })
      addToast('Saved!', 'success')
    },
    onError: () => addToast('Save failed', 'error'),
  })

  const advance = useMutation({
    mutationFn: (status: VideoStatus) =>
      api.patch(`/api/youtube/videos/${video.id}`, { status }).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['videos'] })
      addToast(`Moved to ${STATUS_LABELS[data.status]}!`, 'success')
      onClose()
    },
  })

  const del = useMutation({
    mutationFn: () => api.delete(`/api/youtube/videos/${video.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['videos'] })
      addToast('Deleted', 'info')
      onClose()
    },
  })

  const nextStatus = STATUS_NEXT[video.status]
  const StageIcon = STAGE_ICONS[video.status]

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer panel */}
      <div className="relative ml-auto flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div className="min-w-0">
            <StatusPill status={video.status} />
            <h2 className="mt-2 text-lg font-semibold text-slate-900 truncate">{video.title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Created {formatDate(video.created_at)}</p>
          </div>
          <button onClick={onClose} className="shrink-0 rounded-lg p-2 hover:bg-slate-100">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6">
          {(['info', 'script'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium capitalize transition ${
                tab === t
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t === 'info' ? 'Details' : 'Script'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {tab === 'info' ? (
            <>
              <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Textarea
                label="Idea / Description"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={3}
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">
                  <Tag className="inline h-3.5 w-3.5 mr-1" />Tags (comma-separated)
                </label>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="shorts, nifty, analysis"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              {video.status === 'uploaded' && (
                <Input
                  label="YouTube URL"
                  value={ytUrl}
                  onChange={(e) => setYtUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                />
              )}
            </>
          ) : (
            <Textarea
              label="Script / Content"
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={18}
              placeholder="Write your script here..."
            />
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-100 px-6 py-4 space-y-3">
          {/* Advance pipeline button */}
          {nextStatus && (
            <Button
              className="w-full"
              loading={advance.isPending}
              onClick={() => advance.mutate(nextStatus)}
            >
              Move to {STATUS_LABELS[nextStatus]} <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          {video.status === 'uploaded' && video.youtube_url && (
            <a
              href={video.youtube_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              <ExternalLink className="h-4 w-4" /> View on YouTube
            </a>
          )}

          {/* Save */}
          <Button
            variant="secondary"
            className="w-full"
            loading={update.isPending}
            onClick={() =>
              update.mutate({
                title,
                idea_description: desc,
                script,
                tags,
                youtube_url: ytUrl,
              })
            }
          >
            Save Changes
          </Button>

          {/* Delete */}
          <button
            onClick={() => del.mutate()}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm text-red-500 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete Video
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Kanban column ─────────────────────────────────────────────────────────────
function KanbanColumn({
  status,
  videos,
  onSelect,
}: {
  status: VideoStatus
  videos: Video[]
  onSelect: (v: Video) => void
}) {
  const c = STATUS_COLORS[status]
  const Icon = STAGE_ICONS[status]

  return (
    <div className="flex flex-col min-w-[260px] max-w-[280px] flex-shrink-0">
      {/* Column header */}
      <div className={`flex items-center gap-2 rounded-t-xl border ${c.border} ${c.bg} px-4 py-3`}>
        <Icon className={`h-4 w-4 ${c.text}`} />
        <span className={`text-sm font-semibold ${c.text}`}>{STATUS_LABELS[status]}</span>
        <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-bold ${c.bg} ${c.text} border ${c.border}`}>
          {videos.length}
        </span>
      </div>

      {/* Cards */}
      <div className={`flex flex-col gap-3 rounded-b-xl border-x border-b ${c.border} bg-white/60 p-3 min-h-[200px]`}>
        {videos.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-xs text-slate-400">No videos here</p>
          </div>
        )}
        {videos.map((v) => (
          <button
            key={v.id}
            onClick={() => onSelect(v)}
            className="group w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
          >
            <p className="text-sm font-medium text-slate-900 line-clamp-2 group-hover:text-blue-700">
              {v.title}
            </p>
            {v.idea_description && (
              <p className="mt-1.5 text-xs text-slate-400 line-clamp-2">{v.idea_description}</p>
            )}
            {v.tags && (
              <div className="mt-2 flex flex-wrap gap-1">
                {v.tags.split(',').slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
                  >
                    {t.trim()}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-slate-300">{formatDate(v.created_at)}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function YoutubePage() {
  const qc = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)
  const [selected, setSelected] = useState<Video | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newTags, setNewTags] = useState('')

  const { data: videos = [], isLoading } = useQuery<Video[]>({
    queryKey: ['videos'],
    queryFn: () => api.get('/api/youtube/').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (payload: object) =>
      api.post('/api/youtube/', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['videos'] })
      addToast('Video added to Script stage!', 'success')
      setShowCreate(false)
      setNewTitle('')
      setNewDesc('')
      setNewTags('')
    },
    onError: () => addToast('Failed to create video', 'error'),
  })

  // Group videos by status
  const byStatus = VIDEO_STATUSES.reduce(
    (acc, s) => ({ ...acc, [s]: videos.filter((v) => v.status === s) }),
    {} as Record<VideoStatus, Video[]>
  )

  return (
    <div className="flex flex-col h-full">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">YouTube Pipeline</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {videos.length} video{videos.length !== 1 ? 's' : ''} across {VIDEO_STATUSES.length} stages
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> New Video
        </Button>
      </div>

      {/* ── Pipeline progress bar ── */}
      <div className="mb-6 flex items-center gap-0 rounded-xl overflow-hidden border border-slate-200">
        {VIDEO_STATUSES.map((s, i) => {
          const c = STATUS_COLORS[s]
          const count = byStatus[s]?.length ?? 0
          return (
            <div
              key={s}
              className={`flex-1 flex flex-col items-center py-3 gap-1 ${
                i !== VIDEO_STATUSES.length - 1 ? 'border-r border-slate-200' : ''
              } ${c.bg}`}
            >
              <span className={`text-lg font-bold ${c.text}`}>{count}</span>
              <span className={`text-xs font-medium ${c.text}`}>{STATUS_LABELS[s]}</span>
            </div>
          )
        })}
      </div>

      {/* ── Kanban board ── */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6 flex-1">
          {VIDEO_STATUSES.map((s) => (
            <KanbanColumn
              key={s}
              status={s}
              videos={byStatus[s] ?? []}
              onSelect={setSelected}
            />
          ))}
        </div>
      )}

      {/* ── Video detail drawer ── */}
      {selected && (
        <VideoDrawer
          video={selected}
          onClose={() => setSelected(null)}
        />
      )}

      {/* ── Create video modal ── */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add New Video">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate({
              title: newTitle.trim(),
              idea_description: newDesc,
              tags: newTags,
              status: 'script',
            })
          }}
          className="space-y-4"
        >
          <Input
            label="Video Title"
            placeholder="e.g. How I built a Nifty breakout bot"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
            autoFocus
          />
          <Textarea
            label="Idea / Description"
            placeholder="What is this video about? Key points..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            rows={3}
          />
          <Input
            label="Tags (comma-separated)"
            placeholder="shorts, trading, nifty50"
            value={newTags}
            onChange={(e) => setNewTags(e.target.value)}
          />
          <p className="text-xs text-slate-400">
            Video will start in the <strong>Script</strong> stage.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Add Video
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

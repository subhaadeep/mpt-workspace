'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Youtube } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useUIStore } from '@/store/uiStore'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { VIDEO_STATUSES, type VideoStatus } from '@/lib/constants'

type Video = {
  id: number
  title: string
  description?: string
  status: VideoStatus
  script?: string
  created_at: string
}

const statusVariant: Record<VideoStatus, 'default' | 'warning' | 'info' | 'success'> = {
  Planned: 'default',
  Scripted: 'warning',
  Edited: 'info',
  Uploaded: 'success',
}

const statusOptions = VIDEO_STATUSES.map((s) => ({ value: s, label: s }))

function VideoCard({ video }: { video: Video }) {
  const queryClient = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)
  const [editing, setEditing] = useState(false)
  const [newStatus, setNewStatus] = useState(video.status)

  const updateStatus = useMutation({
    mutationFn: (status: string) =>
      api.patch(`/api/youtube/videos/${video.id}`, { status }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] })
      addToast('Status updated', 'success')
      setEditing(false)
    },
  })

  const del = useMutation({
    mutationFn: () => api.delete(`/api/youtube/videos/${video.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] })
      addToast('Video deleted', 'info')
    },
  })

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-slate-900 truncate text-sm">{video.title}</h4>
          <p className="text-xs text-slate-400 mt-0.5">{formatDate(video.created_at)}</p>
        </div>
        <button
          onClick={() => del.mutate()}
          className="shrink-0 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </CardHeader>
      <CardBody className="space-y-3">
        {video.description && (
          <p className="text-xs text-slate-500 line-clamp-2">{video.description}</p>
        )}
        {editing ? (
          <div className="flex gap-2">
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as VideoStatus)}
              className="flex-1 rounded-lg border border-slate-300 px-2 py-1 text-xs"
            >
              {VIDEO_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <Button size="sm" loading={updateStatus.isPending} onClick={() => updateStatus.mutate(newStatus)}>
              Save
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5"
          >
            <Badge variant={statusVariant[video.status]}>{video.status}</Badge>
            <span className="text-xs text-slate-400">click to change</span>
          </button>
        )}
      </CardBody>
    </Card>
  )
}

export default function YoutubePage() {
  const queryClient = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState<VideoStatus | 'All'>('All')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<VideoStatus>('Planned')

  const { data: videos = [], isLoading } = useQuery<Video[]>({
    queryKey: ['videos'],
    queryFn: () => api.get('/api/youtube/videos').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (payload: { title: string; description: string; status: string }) =>
      api.post('/api/youtube/videos', payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] })
      addToast('Video idea added!', 'success')
      setShowCreate(false)
      setTitle('')
      setDescription('')
      setStatus('Planned')
    },
    onError: () => addToast('Failed to create video', 'error'),
  })

  const filtered = filter === 'All' ? videos : videos.filter((v) => v.status === filter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">YouTube Workflow</h2>
          <p className="text-slate-500 text-sm mt-0.5">Manage video ideas, scripts, and production pipeline</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Add Video
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['All', ...VIDEO_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === s
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s}
            {s !== 'All' && (
              <span className="ml-1.5 text-xs opacity-70">
                ({videos.filter((v) => v.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Youtube}
          title="No videos here"
          description={filter === 'All' ? 'Add your first video idea to get started.' : `No videos with status "${filter}".`}
          action={
            filter === 'All' ? (
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4" /> Add Video
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Video Idea">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate({ title: title.trim(), description, status })
          }}
          className="space-y-4"
        >
          <Input
            label="Title"
            placeholder="e.g. How I built a trading bot"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
          <Textarea
            label="Description / Notes"
            placeholder="Brief outline or research notes..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Select
            label="Initial Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as VideoStatus)}
            options={statusOptions}
          />
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

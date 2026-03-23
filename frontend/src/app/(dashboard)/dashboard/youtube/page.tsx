'use client'
import { useState } from 'react'
import { useVideoIdeas, useCreateVideo, useUpdateVideo, useDeleteVideo } from '@/hooks/useYoutube'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { PageSpinner } from '@/components/ui/Spinner'
import { useUIStore } from '@/store/uiStore'
import { VIDEO_STATUSES, type VideoStatus } from '@/lib/constants'
import { Plus, Trash2, ChevronRight, ChevronLeft } from 'lucide-react'

const statusColors: Record<VideoStatus, 'default' | 'yellow' | 'blue' | 'green'> = {
  Planned: 'default',
  Scripted: 'yellow',
  Edited: 'blue',
  Uploaded: 'green',
}

export default function YoutubePage() {
  const { data: videos, isLoading } = useVideoIdeas()
  const createVideo = useCreateVideo()
  const updateVideo = useUpdateVideo()
  const deleteVideo = useDeleteVideo()
  const { addToast } = useUIStore()

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editScript, setEditScript] = useState('')

  const handleCreate = async () => {
    if (!title.trim()) return
    try {
      await createVideo.mutateAsync({ title, description })
      addToast({ title: 'Video idea added!', variant: 'success' })
      setOpen(false); setTitle(''); setDescription('')
    } catch {
      addToast({ title: 'Failed to create', variant: 'destructive' })
    }
  }

  const moveStatus = async (id: number, direction: 'forward' | 'back', currentStatus: VideoStatus) => {
    const idx = VIDEO_STATUSES.indexOf(currentStatus)
    const newIdx = direction === 'forward' ? idx + 1 : idx - 1
    if (newIdx < 0 || newIdx >= VIDEO_STATUSES.length) return
    try {
      await updateVideo.mutateAsync({ id, status: VIDEO_STATUSES[newIdx] })
    } catch {
      addToast({ title: 'Update failed', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this video idea?')) return
    try {
      await deleteVideo.mutateAsync(id)
      addToast({ title: 'Deleted', variant: 'success' })
    } catch {
      addToast({ title: 'Failed to delete', variant: 'destructive' })
    }
  }

  return (
    <div>
      <TopBar title="YouTube" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{videos?.length ?? 0} ideas total</p>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4" /> New Idea
          </Button>
        </div>

        {isLoading && <PageSpinner />}

        {/* Kanban */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {VIDEO_STATUSES.map((status) => (
            <div key={status}>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant={statusColors[status]}>{status}</Badge>
                <span className="text-xs text-gray-400">
                  {videos?.filter((v) => v.status === status).length ?? 0}
                </span>
              </div>
              <div className="space-y-2">
                {videos?.filter((v) => v.status === status).map((video) => (
                  <Card key={video.id} className="hover:shadow-md transition">
                    <CardContent className="py-3 space-y-2">
                      <p className="text-sm font-semibold text-gray-900 leading-tight">{video.title}</p>
                      {video.description && (
                        <p className="text-xs text-gray-500 line-clamp-2">{video.description}</p>
                      )}
                      <div className="flex items-center gap-1 pt-1">
                        <button
                          disabled={VIDEO_STATUSES.indexOf(status) === 0}
                          onClick={() => moveStatus(video.id, 'back', status)}
                          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={VIDEO_STATUSES.indexOf(status) === VIDEO_STATUSES.length - 1}
                          onClick={() => moveStatus(video.id, 'forward', status)}
                          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex-1" />
                        <button
                          onClick={() => handleDelete(video.id)}
                          className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New Video Idea">
        <div className="space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Video title..." />
          <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this video about?" />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={createVideo.isPending}>Add Idea</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

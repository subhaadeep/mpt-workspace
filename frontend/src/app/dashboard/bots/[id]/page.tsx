'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { useUIStore } from '@/store/uiStore'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'

type Version = {
  id: number
  version_tag: string
  notes?: string
  created_at: string
}

type BotDetail = {
  id: number
  name: string
  description?: string
  tags?: string
  created_at: string
  versions: Version[]
}

function VersionCard({ v, botId }: { v: Version; botId: number }) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)

  const del = useMutation({
    mutationFn: () => api.delete(`/api/bots/${botId}/versions/${v.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot', botId] })
      addToast('Version deleted', 'info')
    },
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="info">{v.version_tag}</Badge>
            <span className="text-xs text-slate-400">{formatDate(v.created_at)}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setOpen(!open)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100"
            >
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <button
              onClick={() => del.mutate()}
              className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </CardHeader>
      {open && v.notes && (
        <CardBody>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{v.notes}</p>
        </CardBody>
      )}
    </Card>
  )
}

export default function BotDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)
  const [showAddVersion, setShowAddVersion] = useState(false)
  const [vTag, setVTag] = useState('')
  const [vNotes, setVNotes] = useState('')

  const { data: bot, isLoading } = useQuery<BotDetail>({
    queryKey: ['bot', Number(id)],
    queryFn: () => api.get(`/api/bots/${id}`).then((r) => r.data),
  })

  const addVersion = useMutation({
    mutationFn: (payload: { version_tag: string; notes: string }) =>
      api.post(`/api/bots/${id}/versions`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot', Number(id)] })
      addToast('Version added!', 'success')
      setShowAddVersion(false)
      setVTag('')
      setVNotes('')
    },
    onError: () => addToast('Failed to add version', 'error'),
  })

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>
  if (!bot) return <p className="text-slate-500">Bot not found.</p>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => router.back()}
          className="mt-1 rounded-lg border border-slate-200 p-2 hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-slate-900 truncate">{bot.name}</h2>
          <p className="text-slate-500 text-sm mt-0.5">{bot.description}</p>
          {bot.tags && (
            <div className="flex flex-wrap gap-1 mt-2">
              {bot.tags.split(',').map((t) => (
                <Badge key={t} variant="info">{t.trim()}</Badge>
              ))}
            </div>
          )}
        </div>
        <Button onClick={() => setShowAddVersion(true)}>
          <Plus className="h-4 w-4" /> Add Version
        </Button>
      </div>

      {/* Versions */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-3">
          Versions ({bot.versions?.length ?? 0})
        </h3>
        {bot.versions?.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-slate-200 py-10 text-center">
            <p className="text-slate-500">No versions yet. Add the first version.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bot.versions?.map((v) => (
              <VersionCard key={v.id} v={v} botId={bot.id} />
            ))}
          </div>
        )}
      </div>

      {/* Add Version Modal */}
      <Modal open={showAddVersion} onClose={() => setShowAddVersion(false)} title="Add Version">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            addVersion.mutate({ version_tag: vTag, notes: vNotes })
          }}
          className="space-y-4"
        >
          <Input
            label="Version Tag"
            placeholder="e.g. v1.0, v2.3"
            value={vTag}
            onChange={(e) => setVTag(e.target.value)}
            required
            autoFocus
          />
          <Textarea
            label="Notes"
            placeholder="What changed in this version?"
            value={vNotes}
            onChange={(e) => setVNotes(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowAddVersion(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={addVersion.isPending}>
              Add Version
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

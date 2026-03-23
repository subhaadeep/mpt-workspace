'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Bot, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useUIStore } from '@/store/uiStore'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

type BotType = {
  id: number
  name: string
  description?: string
  tags?: string
  created_at: string
  versions?: unknown[]
}

export default function BotsPage() {
  const queryClient = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')

  const { data: bots = [], isLoading } = useQuery<BotType[]>({
    queryKey: ['bots'],
    queryFn: () => api.get('/api/bots').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; description: string; tags: string }) =>
      api.post('/api/bots', payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] })
      addToast('Bot created successfully!', 'success')
      setShowCreate(false)
      setName('')
      setDescription('')
      setTags('')
    },
    onError: () => addToast('Failed to create bot', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/bots/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] })
      addToast('Bot deleted', 'info')
    },
    onError: () => addToast('Failed to delete bot', 'error'),
  })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    createMutation.mutate({ name: name.trim(), description, tags })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Bots</h2>
          <p className="text-slate-500 text-sm mt-0.5">Manage your algorithmic trading bots and versions</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="md">
          <Plus className="h-4 w-4" /> New Bot
        </Button>
      </div>

      {/* Bot List */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : bots.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="No bots yet"
          description="Create your first trading bot to get started."
          action={
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" /> Create Bot
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bots.map((bot) => (
            <Card key={bot.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex items-start justify-between">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{bot.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDate(bot.created_at)}</p>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(bot.id)}
                  className="ml-2 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </CardHeader>
              <CardBody className="space-y-3">
                {bot.description && (
                  <p className="text-sm text-slate-600 line-clamp-2">{bot.description}</p>
                )}
                {bot.tags && (
                  <div className="flex flex-wrap gap-1">
                    {bot.tags.split(',').map((t) => (
                      <Badge key={t} variant="info">{t.trim()}</Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <Badge variant="default">{bot.versions?.length ?? 0} versions</Badge>
                  <Link
                    href={`/dashboard/bots/${bot.id}`}
                    className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                  >
                    Open <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Bot">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Bot Name"
            placeholder="e.g. Breakout Strategy v1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <Textarea
            label="Description"
            placeholder="Describe what this bot does..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Input
            label="Tags (comma-separated)"
            placeholder="e.g. breakout, nifty, 15min"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Create Bot
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

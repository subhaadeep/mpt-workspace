'use client'
import { useState } from 'react'
import { useBots, useCreateBot, useDeleteBot } from '@/hooks/useBots'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'
import { useUIStore } from '@/store/uiStore'
import { Plus, Trash2, ChevronRight, Tag } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default function BotsPage() {
  const { data: bots, isLoading } = useBots()
  const createBot = useCreateBot()
  const deleteBot = useDeleteBot()
  const { addToast } = useUIStore()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')

  const handleCreate = async () => {
    if (!name.trim()) return
    try {
      await createBot.mutateAsync({
        name,
        description,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      })
      addToast({ title: 'Bot created!', variant: 'success' })
      setOpen(false); setName(''); setDescription(''); setTags('')
    } catch {
      addToast({ title: 'Failed to create bot', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirm('Delete this bot?')) return
    try {
      await deleteBot.mutateAsync(id)
      addToast({ title: 'Bot deleted', variant: 'success' })
    } catch {
      addToast({ title: 'Failed to delete', variant: 'destructive' })
    }
  }

  return (
    <div>
      <TopBar title="Bots" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{bots?.length ?? 0} bots total</p>
          <Button onClick={() => setOpen(true)} size="sm">
            <Plus className="w-4 h-4" /> New Bot
          </Button>
        </div>

        {isLoading && <PageSpinner />}

        <div className="grid gap-3">
          {bots?.map((bot) => (
            <Link key={bot.id} href={`/dashboard/bots/${bot.id}`}>
              <Card className="hover:border-brand-400 hover:shadow-md transition cursor-pointer">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">{bot.name}</p>
                    <p className="text-xs text-gray-500">{bot.description}</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {bot.tags?.map((tag) => (
                        <Badge key={tag} variant="default" className="text-xs">
                          <Tag className="w-2.5 h-2.5 mr-1" />{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{formatDate(bot.created_at)}</span>
                    <button
                      onClick={(e) => handleDelete(bot.id, e)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {!isLoading && bots?.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-5xl mb-4">🤖</p>
              <p className="font-medium">No bots yet</p>
              <p className="text-sm">Create your first bot to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="New Bot">
        <div className="space-y-4">
          <Input label="Bot Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Scalper v2" />
          <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this bot do?" />
          <Input label="Tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="crypto, scalping, BTC" />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={createBot.isPending}>Create Bot</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

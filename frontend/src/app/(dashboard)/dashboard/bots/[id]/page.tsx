'use client'
import { useState } from 'react'
import { use } from 'react'
import { useBot, useBotVersions, useCreateBotVersion } from '@/hooks/useBots'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'
import { useUIStore } from '@/store/uiStore'
import { Plus, ArrowLeft, Tag, GitBranch } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default function BotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const botId = parseInt(id)
  const { data: bot, isLoading: botLoading } = useBot(botId)
  const { data: versions, isLoading: versionsLoading } = useBotVersions(botId)
  const createVersion = useCreateBotVersion()
  const { addToast } = useUIStore()

  const [open, setOpen] = useState(false)
  const [versionLabel, setVersionLabel] = useState('')
  const [notes, setNotes] = useState('')

  const handleCreateVersion = async () => {
    if (!versionLabel.trim()) return
    try {
      await createVersion.mutateAsync({ botId, version_label: versionLabel, notes })
      addToast({ title: 'Version added!', variant: 'success' })
      setOpen(false); setVersionLabel(''); setNotes('')
    } catch {
      addToast({ title: 'Failed to add version', variant: 'destructive' })
    }
  }

  if (botLoading) return <PageSpinner />
  if (!bot) return <div className="p-6 text-gray-500">Bot not found.</div>

  return (
    <div>
      <TopBar title={bot.name} />
      <div className="p-6 space-y-6">
        {/* Back */}
        <Link href="/dashboard/bots" className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Bots
        </Link>

        {/* Bot Info */}
        <Card>
          <CardHeader><CardTitle>{bot.name}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">{bot.description}</p>
            <div className="flex flex-wrap gap-1">
              {bot.tags?.map((tag) => (
                <Badge key={tag} variant="blue">
                  <Tag className="w-2.5 h-2.5 mr-1" />{tag}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-gray-400">Created {formatDate(bot.created_at)}</p>
          </CardContent>
        </Card>

        {/* Versions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-brand-500" /> Versions
            </h2>
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4" /> Add Version
            </Button>
          </div>

          {versionsLoading && <PageSpinner />}

          <div className="space-y-3">
            {versions?.map((v) => (
              <Card key={v.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="blue">{v.version_label}</Badge>
                      <span className="text-sm text-gray-500">{v.notes}</span>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(v.created_at)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {!versionsLoading && versions?.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <p className="text-4xl mb-3">📂</p>
                <p className="text-sm">No versions yet. Add the first one.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Version">
        <div className="space-y-4">
          <Input label="Version Label" value={versionLabel} onChange={(e) => setVersionLabel(e.target.value)} placeholder="v1.0, v2-ga, etc." />
          <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What changed in this version?" />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateVersion} loading={createVersion.isPending}>Add Version</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

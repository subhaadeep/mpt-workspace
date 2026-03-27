'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronLeft, Plus, Save, Trash2, Image, Code2, FlaskConical,
  CheckCircle2, Clock, Settings2, StickyNote, ExternalLink, X,
  ChevronDown, Copy, Check
} from 'lucide-react'
import api from '@/lib/api'
import { useUIStore } from '@/store/uiStore'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'

type Input = { name: string; type: string; value: string; description: string }
type Screenshot = { title: string; gdrive_url: string; description: string }
type ExtraSection = { title: string; content: string }
type GAEntry = { id: number; run_name: string; notes: string; parameter_sets: unknown; optimization_results: unknown; best_chromosomes: unknown; created_at: string }
type CodeEntry = { id: number; language: string; label: string; code: string; description: string }

type Version = {
  id: number; version_name: string; notes: string | null
  changes_description: string | null
  implemented_features: string[] | null; planned_changes: string[] | null
  inputs: Input[] | null; screenshots: Screenshot[] | null
  extra_sections: ExtraSection[] | null; created_at: string
}

type BotDetail = { id: number; name: string; description: string | null; tags: string | null; status: string; priority: number }

const TABS = [
  { key: 'overview',    label: 'Overview',    icon: StickyNote },
  { key: 'inputs',      label: 'Inputs',      icon: Settings2 },
  { key: 'features',    label: 'Features',    icon: CheckCircle2 },
  { key: 'screenshots', label: 'Screenshots', icon: Image },
  { key: 'ga',          label: 'GA / ML',     icon: FlaskConical },
  { key: 'code',        label: 'Code',        icon: Code2 },
  { key: 'extra',       label: 'Extra',       icon: Plus },
]

export default function BotDetailPage() {
  const { botId } = useParams<{ botId: string }>()
  const router = useRouter()
  const { addToast } = useUIStore()

  const [bot, setBot] = useState<BotDetail | null>(null)
  const [versions, setVersions] = useState<Version[]>([])
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [showNewVersion, setShowNewVersion] = useState(false)
  const [newVersionName, setNewVersionName] = useState('')
  const [gaRuns, setGaRuns] = useState<GAEntry[]>([])
  const [codeEntries, setCodeEntries] = useState<CodeEntry[]>([])

  const selectedVersion = versions.find(v => v.id === selectedVersionId) ?? null

  const loadVersionDetails = useCallback(async (vId: number) => {
    const [gaRes, codeRes] = await Promise.allSettled([
      api.get(`/api/bots/${botId}/versions/${vId}/ga`),
      api.get(`/api/bots/${botId}/versions/${vId}/code`),
    ])
    if (gaRes.status === 'fulfilled') setGaRuns(gaRes.value.data)
    if (codeRes.status === 'fulfilled') setCodeEntries(codeRes.value.data)
  }, [botId])

  async function load() {
    try {
      const [botRes, verRes] = await Promise.all([
        api.get(`/api/bots/${botId}`),
        api.get(`/api/bots/${botId}/versions`),
      ])
      setBot(botRes.data)
      const vers: Version[] = verRes.data
      setVersions(vers)
      if (vers.length > 0) setSelectedVersionId(vers[0].id)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [botId])
  useEffect(() => { if (selectedVersionId) loadVersionDetails(selectedVersionId) }, [selectedVersionId, loadVersionDetails])

  async function createVersion() {
    if (!newVersionName.trim()) return
    const { data } = await api.post(`/api/bots/${botId}/versions`, {
      version_name: newVersionName,
      inputs: selectedVersion?.inputs ?? [],
    })
    addToast(`Version ${newVersionName} created`, 'success')
    setNewVersionName('')
    setShowNewVersion(false)
    await load()
    setSelectedVersionId(data.id)
  }

  async function saveVersionField(field: string, value: unknown) {
    if (!selectedVersionId) return
    await api.patch(`/api/bots/${botId}/versions/${selectedVersionId}`, { [field]: value })
    const { data } = await api.get(`/api/bots/${botId}/versions`)
    setVersions(data)
    addToast('Saved ✓', 'success')
  }

  const statusVariant = (s: string) => s === 'active' ? 'success' : s === 'experimental' ? 'warning' : 'default'

  if (loading) return (
    <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  )
  if (!bot) return (
    <div className="py-20 text-center text-slate-500">Bot not found</div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <button onClick={() => router.push('/dashboard/bots')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors">
        <ChevronLeft className="h-4 w-4" /> Back to Bots
      </button>

      {/* Bot header */}
      <div className="rounded-2xl border border-white/5 bg-white/2 p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{bot.name}</h1>
              <Badge variant={statusVariant(bot.status)}>{bot.status}</Badge>
            </div>
            {bot.description && <p className="mt-1 text-sm text-slate-500">{bot.description}</p>}
            {bot.tags && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {bot.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                  <span key={tag} className="rounded-full border border-white/8 bg-white/4 px-2.5 py-0.5 text-xs text-slate-400">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Version selector row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Version</span>
          <div className="relative">
            <select
              value={selectedVersionId ?? ''}
              onChange={e => setSelectedVersionId(Number(e.target.value))}
              className="appearance-none rounded-xl border border-white/8 bg-[#0d1424] pl-3 pr-8 py-2 text-sm font-medium text-white outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
            >
              {versions.length === 0 && <option value="">No versions</option>}
              {versions.map(v => <option key={v.id} value={v.id}>{v.version_name}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-slate-500" />
          </div>
        </div>

        {showNewVersion ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              placeholder="e.g. v2.0"
              value={newVersionName}
              onChange={e => setNewVersionName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createVersion()}
              className="rounded-xl border border-white/8 bg-white/4 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60"
            />
            <button onClick={createVersion} className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500">Add</button>
            <button onClick={() => setShowNewVersion(false)} className="rounded-xl border border-white/8 px-3 py-2 text-sm text-slate-400 hover:bg-white/5">Cancel</button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewVersion(true)}
            className="flex items-center gap-1.5 rounded-xl border border-dashed border-white/15 px-3 py-2 text-sm text-slate-500 hover:border-blue-500/40 hover:text-blue-400 transition-all"
          >
            <Plus className="h-3.5 w-3.5" /> New Version
          </button>
        )}
      </div>

      {selectedVersion ? (
        <>
          {/* Tab bar */}
          <div className="flex gap-0.5 overflow-x-auto border-b border-white/5 pb-0">
            {TABS.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex shrink-0 items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />{tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          <div className="rounded-2xl border border-white/5 bg-white/2 p-5 min-h-[300px]">
            {activeTab === 'overview'    && <OverviewTab    version={selectedVersion} onSave={saveVersionField} />}
            {activeTab === 'inputs'      && <InputsTab      version={selectedVersion} onSave={saveVersionField} />}
            {activeTab === 'features'    && <FeaturesTab    version={selectedVersion} onSave={saveVersionField} />}
            {activeTab === 'screenshots' && <ScreenshotsTab version={selectedVersion} onSave={saveVersionField} />}
            {activeTab === 'ga'          && <GATab botId={botId} versionId={selectedVersionId!} gaRuns={gaRuns} reload={() => loadVersionDetails(selectedVersionId!)} addToast={addToast} />}
            {activeTab === 'code'        && <CodeTab botId={botId} versionId={selectedVersionId!} codeEntries={codeEntries} reload={() => loadVersionDetails(selectedVersionId!)} addToast={addToast} />}
            {activeTab === 'extra'       && <ExtraTab version={selectedVersion} onSave={saveVersionField} />}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-white/8">
          <p className="text-slate-500">No versions yet.</p>
          <button onClick={() => setShowNewVersion(true)} className="mt-3 text-sm text-blue-400 hover:underline">Create first version</button>
        </div>
      )}
    </div>
  )
}

// ─── DARK INPUT / TEXTAREA HELPERS ───────────────────
const inputCls = 'rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 w-full'
const areaCls = inputCls + ' resize-y'
const saveBtnCls = 'flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all'
const addBtnCls = 'flex items-center gap-1.5 rounded-xl border border-dashed border-white/15 px-3 py-2 text-sm text-slate-500 hover:border-blue-500/40 hover:text-blue-400 transition-all'

// ─── OVERVIEW ────────────────────────────────────────
function OverviewTab({ version, onSave }: { version: Version; onSave: (f: string, v: unknown) => void }) {
  const [notes, setNotes] = useState(version.notes ?? '')
  const [changes, setChanges] = useState(version.changes_description ?? '')
  useEffect(() => { setNotes(version.notes ?? ''); setChanges(version.changes_description ?? '') }, [version.id])

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Version Notes</label>
        <textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder="General notes about this version..." className={areaCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Changes from Previous Version</label>
        <textarea rows={4} value={changes} onChange={e => setChanges(e.target.value)} placeholder="What changed, improved or removed compared to previous version..." className={areaCls} />
      </div>
      <button onClick={() => { onSave('notes', notes); onSave('changes_description', changes) }} className={saveBtnCls}>
        <Save className="h-4 w-4" /> Save
      </button>
    </div>
  )
}

// ─── INPUTS ──────────────────────────────────────────
function InputsTab({ version, onSave }: { version: Version; onSave: (f: string, v: unknown) => void }) {
  const [inputs, setInputs] = useState<Input[]>(version.inputs ?? [])
  useEffect(() => { setInputs(version.inputs ?? []) }, [version.id])

  function addInput() { setInputs(p => [...p, { name: '', type: 'number', value: '', description: '' }]) }
  function updateInput(i: number, field: keyof Input, val: string) {
    setInputs(p => p.map((inp, idx) => idx === i ? { ...inp, [field]: val } : inp))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white">Strategy Inputs</h3>
          <p className="text-xs text-slate-500">All configurable parameters. Auto-copied when creating a new version.</p>
        </div>
        <button onClick={addInput} className={addBtnCls}><Plus className="h-3.5 w-3.5" /> Add Input</button>
      </div>

      {inputs.length === 0 && <p className="text-sm text-slate-600 py-6 text-center">No inputs defined yet.</p>}

      <div className="space-y-2">
        {inputs.map((inp, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 rounded-xl border border-white/5 bg-white/2 p-3">
            <input placeholder="Name" value={inp.name} onChange={e => updateInput(i, 'name', e.target.value)} className="col-span-3 rounded-xl border border-white/8 bg-white/4 px-2.5 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60" />
            <select value={inp.type} onChange={e => updateInput(i, 'type', e.target.value)} className="col-span-2 rounded-xl border border-white/8 bg-[#0d1424] px-2.5 py-2 text-sm text-white outline-none focus:border-blue-500/60">
              <option>number</option><option>string</option><option>boolean</option><option>array</option>
            </select>
            <input placeholder="Value" value={inp.value} onChange={e => updateInput(i, 'value', e.target.value)} className="col-span-2 rounded-xl border border-white/8 bg-white/4 px-2.5 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60" />
            <input placeholder="Description" value={inp.description} onChange={e => updateInput(i, 'description', e.target.value)} className="col-span-4 rounded-xl border border-white/8 bg-white/4 px-2.5 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60" />
            <button onClick={() => setInputs(p => p.filter((_, idx) => idx !== i))} className="col-span-1 flex items-center justify-center rounded-xl text-slate-600 hover:bg-red-500/10 hover:text-red-400">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <button onClick={() => onSave('inputs', inputs)} className={saveBtnCls}>
        <Save className="h-4 w-4" /> Save Inputs
      </button>
    </div>
  )
}

// ─── FEATURES ────────────────────────────────────────
function FeaturesTab({ version, onSave }: { version: Version; onSave: (f: string, v: unknown) => void }) {
  const [implemented, setImplemented] = useState<string[]>(version.implemented_features ?? [])
  const [planned, setPlanned] = useState<string[]>(version.planned_changes ?? [])
  const [newImpl, setNewImpl] = useState('')
  const [newPlan, setNewPlan] = useState('')
  useEffect(() => { setImplemented(version.implemented_features ?? []); setPlanned(version.planned_changes ?? []) }, [version.id])

  function add(list: string[], setList: (v: string[]) => void, val: string, setVal: (v: string) => void) {
    if (!val.trim()) return; setList([...list, val.trim()]); setVal('')
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 font-semibold text-emerald-400"><CheckCircle2 className="h-4 w-4" /> Implemented</h3>
        <div className="space-y-1.5">
          {implemented.map((item, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
              <span className="flex-1 text-sm text-slate-300">{item}</span>
              <button onClick={() => setImplemented(implemented.filter((_, idx) => idx !== i))} className="text-slate-600 hover:text-red-400"><X className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input placeholder="Add implemented feature..." value={newImpl} onChange={e => setNewImpl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add(implemented, setImplemented, newImpl, setNewImpl)}
            className="flex-1 rounded-xl border border-white/8 bg-white/4 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-emerald-500/60" />
          <button onClick={() => add(implemented, setImplemented, newImpl, setNewImpl)} className="rounded-xl bg-emerald-600/20 border border-emerald-500/30 px-3 py-2 text-emerald-400 hover:bg-emerald-600/30">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="flex items-center gap-2 font-semibold text-amber-400"><Clock className="h-4 w-4" /> Planned Changes</h3>
        <div className="space-y-1.5">
          {planned.map((item, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2">
              <span className="flex-1 text-sm text-slate-300">{item}</span>
              <button onClick={() => setPlanned(planned.filter((_, idx) => idx !== i))} className="text-slate-600 hover:text-red-400"><X className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input placeholder="Add planned change..." value={newPlan} onChange={e => setNewPlan(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add(planned, setPlanned, newPlan, setNewPlan)}
            className="flex-1 rounded-xl border border-white/8 bg-white/4 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-amber-500/60" />
          <button onClick={() => add(planned, setPlanned, newPlan, setNewPlan)} className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-amber-400 hover:bg-amber-500/20">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="md:col-span-2">
        <button onClick={() => { onSave('implemented_features', implemented); onSave('planned_changes', planned) }} className={saveBtnCls}>
          <Save className="h-4 w-4" /> Save Features
        </button>
      </div>
    </div>
  )
}

// ─── SCREENSHOTS ─────────────────────────────────────
function ScreenshotsTab({ version, onSave }: { version: Version; onSave: (f: string, v: unknown) => void }) {
  const [screenshots, setScreenshots] = useState<Screenshot[]>(version.screenshots ?? [])
  useEffect(() => { setScreenshots(version.screenshots ?? []) }, [version.id])

  function update(i: number, field: keyof Screenshot, val: string) {
    setScreenshots(p => p.map((s, idx) => idx === i ? { ...s, [field]: val } : s))
  }

  function toPreviewUrl(url: string) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
    if (match) return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`
    return url
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white">Screenshots</h3>
          <p className="text-xs text-slate-500">Paste Google Drive share links — embedded as images.</p>
        </div>
        <button onClick={() => setScreenshots(p => [...p, { title: '', gdrive_url: '', description: '' }])} className={addBtnCls}>
          <Plus className="h-3.5 w-3.5" /> Add Screenshot
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {screenshots.map((s, i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-white/2 overflow-hidden">
            {s.gdrive_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={toPreviewUrl(s.gdrive_url)} alt={s.title || 'screenshot'}
                className="w-full h-44 object-cover bg-white/5"
                onError={e => (e.currentTarget.style.display = 'none')} />
            ) : (
              <div className="h-32 bg-white/3 flex items-center justify-center">
                <Image className="h-8 w-8 text-slate-700" />
              </div>
            )}
            <div className="p-3 space-y-2">
              <input placeholder="Title" value={s.title} onChange={e => update(i, 'title', e.target.value)} className="rounded-xl border border-white/8 bg-white/4 px-2.5 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60 w-full" />
              <input placeholder="Google Drive share URL" value={s.gdrive_url} onChange={e => update(i, 'gdrive_url', e.target.value)} className="rounded-xl border border-white/8 bg-white/4 px-2.5 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60 w-full" />
              {s.gdrive_url && (
                <a href={s.gdrive_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-400 hover:underline">
                  <ExternalLink className="h-3 w-3" /> Open in Drive
                </a>
              )}
              <input placeholder="Description" value={s.description} onChange={e => update(i, 'description', e.target.value)} className="rounded-xl border border-white/8 bg-white/4 px-2.5 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60 w-full" />
              <button onClick={() => setScreenshots(p => p.filter((_, idx) => idx !== i))} className="text-xs text-red-500 hover:underline">Remove</button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => onSave('screenshots', screenshots)} className={saveBtnCls}>
        <Save className="h-4 w-4" /> Save Screenshots
      </button>
    </div>
  )
}

// ─── GA / ML TAB ─────────────────────────────────────
function GATab({ botId, versionId, gaRuns, reload, addToast }: {
  botId: string; versionId: number; gaRuns: GAEntry[]
  reload: () => void; addToast: (m: string, t: 'success'|'error'|'info'|'warning') => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ run_name: '', notes: '', algo_type: 'GA', parameter_sets: '', optimization_results: '', best_chromosomes: '' })
  const [saving, setSaving] = useState(false)

  async function submit() {
    setSaving(true)
    try {
      await api.post(`/api/bots/${botId}/versions/${versionId}/ga`, {
        run_name: form.run_name, notes: form.notes,
        parameter_sets: form.parameter_sets ? JSON.parse(form.parameter_sets) : null,
        optimization_results: form.optimization_results ? JSON.parse(form.optimization_results) : null,
        best_chromosomes: form.best_chromosomes ? JSON.parse(form.best_chromosomes) : null,
      })
      addToast('GA run added', 'success'); setShowForm(false); reload()
    } catch { addToast('Error: check JSON fields', 'error') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white">GA / ML Algorithm Runs</h3>
          <p className="text-xs text-slate-500">Store GA, XGBoost, LSTM or any algorithm run results.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className={addBtnCls}><Plus className="h-3.5 w-3.5" /> Add Run</button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-white/8 bg-white/2 p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input placeholder="Run name (e.g. GA Run 1 - April)" value={form.run_name} onChange={e => setForm(f=>({...f,run_name:e.target.value}))} className={inputCls} />
            <input placeholder="Algorithm type (GA, XGBoost, LSTM...)" value={form.algo_type} onChange={e => setForm(f=>({...f,algo_type:e.target.value}))} className={inputCls} />
          </div>
          <textarea placeholder="Notes" rows={2} value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} className={areaCls} />
          <textarea placeholder='Parameter sets (JSON array)' rows={3} value={form.parameter_sets} onChange={e => setForm(f=>({...f,parameter_sets:e.target.value}))} className={areaCls + ' font-mono text-xs'} />
          <textarea placeholder='Best chromosomes / model params (JSON)' rows={3} value={form.best_chromosomes} onChange={e => setForm(f=>({...f,best_chromosomes:e.target.value}))} className={areaCls + ' font-mono text-xs'} />
          <textarea placeholder='Optimization results (JSON)' rows={3} value={form.optimization_results} onChange={e => setForm(f=>({...f,optimization_results:e.target.value}))} className={areaCls + ' font-mono text-xs'} />
          <div className="flex gap-2">
            <button onClick={submit} disabled={saving} className={saveBtnCls + ' disabled:opacity-60'}>{saving ? <Spinner size="sm" /> : null} Save Run</button>
            <button onClick={() => setShowForm(false)} className="rounded-xl border border-white/8 px-4 py-2.5 text-sm text-slate-400 hover:bg-white/5">Cancel</button>
          </div>
        </div>
      )}

      {gaRuns.length === 0 && !showForm && <p className="py-10 text-center text-sm text-slate-600">No algorithm runs stored yet.</p>}

      <div className="space-y-3">
        {gaRuns.map(run => (
          <div key={run.id} className="rounded-2xl border border-white/5 bg-white/2 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">{run.run_name || `Run #${run.id}`}</span>
              <button onClick={async () => { await api.delete(`/api/bots/${botId}/versions/${versionId}/ga/${run.id}`); reload() }} className="text-slate-600 hover:text-red-400 rounded-xl p-1.5 hover:bg-red-500/10">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {run.notes && <p className="text-sm text-slate-500 mb-2">{run.notes}</p>}
            {run.parameter_sets && (
              <details className="mt-2 group">
                <summary className="text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-300">Parameter Sets</summary>
                <pre className="mt-1.5 rounded-xl bg-[#0a0f1a] border border-white/5 p-3 text-xs text-slate-300 overflow-x-auto">{JSON.stringify(run.parameter_sets, null, 2)}</pre>
              </details>
            )}
            {run.best_chromosomes && (
              <details className="mt-2">
                <summary className="text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-300">Best Chromosomes / Params</summary>
                <pre className="mt-1.5 rounded-xl bg-[#0a0f1a] border border-white/5 p-3 text-xs text-slate-300 overflow-x-auto">{JSON.stringify(run.best_chromosomes, null, 2)}</pre>
              </details>
            )}
            {run.optimization_results && (
              <details className="mt-2">
                <summary className="text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-300">Optimization Results</summary>
                <pre className="mt-1.5 rounded-xl bg-[#0a0f1a] border border-white/5 p-3 text-xs text-slate-300 overflow-x-auto">{JSON.stringify(run.optimization_results, null, 2)}</pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── CODE TAB ─────────────────────────────────────────
function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      title="Copy code"
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
        copied
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          : 'bg-white/8 text-slate-400 hover:bg-white/12 hover:text-slate-200 border border-white/10'
      }`}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

function CodeTab({ botId, versionId, codeEntries, reload, addToast }: {
  botId: string; versionId: number; codeEntries: CodeEntry[]
  reload: () => void; addToast: (m: string, t: 'success'|'error'|'info'|'warning') => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ language: 'python', label: '', code: '', description: '' })
  const [saving, setSaving] = useState(false)

  async function submit() {
    setSaving(true)
    try {
      await api.post(`/api/bots/${botId}/versions/${versionId}/code`, form)
      addToast('Code added', 'success'); setShowForm(false)
      setForm({ language: 'python', label: '', code: '', description: '' }); reload()
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white">Code Storage</h3>
          <p className="text-xs text-slate-500">Store strategy code — Python, Pine Script, MQL5, etc.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className={addBtnCls}><Plus className="h-3.5 w-3.5" /> Add Code</button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-white/8 bg-white/2 p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <select value={form.language} onChange={e => setForm(f=>({...f,language:e.target.value}))} className="rounded-xl border border-white/8 bg-[#0d1424] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/60">
              <option value="python">Python</option>
              <option value="pinescript">Pine Script</option>
              <option value="mql5">MQL5</option>
              <option value="other">Other</option>
            </select>
            <input placeholder="Label (e.g. strategy_v2.py)" value={form.label} onChange={e => setForm(f=>({...f,label:e.target.value}))} className={inputCls} />
          </div>
          <input placeholder="Description" value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} className={inputCls} />
          <textarea placeholder="Paste code here..." rows={10} value={form.code} onChange={e => setForm(f=>({...f,code:e.target.value}))} className={`${areaCls} font-mono text-xs`} />
          <div className="flex gap-2">
            <button onClick={submit} disabled={saving} className={saveBtnCls + ' disabled:opacity-60'}>{saving ? <Spinner size="sm" /> : null} Save Code</button>
            <button onClick={() => setShowForm(false)} className="rounded-xl border border-white/8 px-4 py-2.5 text-sm text-slate-400 hover:bg-white/5">Cancel</button>
          </div>
        </div>
      )}

      {codeEntries.length === 0 && !showForm && <p className="py-10 text-center text-sm text-slate-600">No code stored yet.</p>}

      <div className="space-y-4">
        {codeEntries.map(entry => (
          <div key={entry.id} className="rounded-2xl border border-white/8 overflow-hidden">
            <div className="flex items-center justify-between bg-[#0d1424] border-b border-white/8 px-4 py-2.5">
              <div className="flex items-center gap-2.5">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/60" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/60" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/60" />
                </div>
                <span className="rounded-md bg-blue-600/20 border border-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-300 uppercase tracking-wide">{entry.language ?? 'code'}</span>
                <span className="text-sm font-mono text-slate-300">{entry.label || 'untitled'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CopyButton code={entry.code ?? ''} />
                <button onClick={async () => { await api.delete(`/api/bots/${botId}/versions/${versionId}/code/${entry.id}`); reload() }} className="rounded-lg p-1.5 text-slate-600 hover:bg-red-500/10 hover:text-red-400">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            {entry.description && (
              <div className="px-4 py-2 border-b border-white/5 bg-white/2">
                <p className="text-xs text-slate-500">{entry.description}</p>
              </div>
            )}
            <pre className="overflow-x-auto p-4 text-xs bg-[#070c14] text-slate-200 max-h-96 font-mono leading-relaxed">{entry.code ?? ''}</pre>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── EXTRA SECTIONS ──────────────────────────────────
function ExtraTab({ version, onSave }: { version: Version; onSave: (f: string, v: unknown) => void }) {
  const [sections, setSections] = useState<ExtraSection[]>(version.extra_sections ?? [])
  useEffect(() => { setSections(version.extra_sections ?? []) }, [version.id])

  function update(i: number, field: keyof ExtraSection, val: string) {
    setSections(p => p.map((s, idx) => idx === i ? { ...s, [field]: val } : s))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white">Extra Sections</h3>
          <p className="text-xs text-slate-500">Add any freeform section — risk analysis, trade journal, links, notes, etc.</p>
        </div>
        <button onClick={() => setSections(p => [...p, { title: '', content: '' }])} className={addBtnCls}>
          <Plus className="h-3.5 w-3.5" /> Add Section
        </button>
      </div>

      {sections.length === 0 && <p className="text-center py-10 text-sm text-slate-600">No extra sections yet.</p>}

      <div className="space-y-4">
        {sections.map((s, i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-white/2 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <input placeholder="Section title" value={s.title} onChange={e => update(i, 'title', e.target.value)}
                className="flex-1 rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm font-medium text-white placeholder-slate-600 outline-none focus:border-blue-500/60" />
              <button onClick={() => setSections(p => p.filter((_, idx) => idx !== i))} className="rounded-xl p-2 text-slate-600 hover:bg-red-500/10 hover:text-red-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea rows={4} placeholder="Content..." value={s.content} onChange={e => update(i, 'content', e.target.value)}
              className={areaCls} />
          </div>
        ))}
      </div>

      <button onClick={() => onSave('extra_sections', sections)} className={saveBtnCls}>
        <Save className="h-4 w-4" /> Save Sections
      </button>
    </div>
  )
}

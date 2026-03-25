'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronLeft, Plus, Save, Trash2, Image, Code2, FlaskConical,
  CheckCircle2, Clock, Settings2, StickyNote, ExternalLink, X, ChevronDown
} from 'lucide-react'
import api from '@/lib/api'
import { useUIStore } from '@/store/uiStore'

type Input = { name: string; type: string; value: string; description: string }
type Screenshot = { title: string; gdrive_url: string; description: string }
type ExtraSection = { title: string; content: string }
type GAEntry = { id: number; run_name: string; notes: string; parameter_sets: unknown; optimization_results: unknown; best_chromosomes: unknown; created_at: string }
type CodeEntry = { id: number; language: string; filename: string; code_content: string; description: string }

type Version = {
  id: number
  version_name: string
  notes: string | null
  changes_description: string | null
  implemented_features: string[] | null
  planned_changes: string[] | null
  inputs: Input[] | null
  screenshots: Screenshot[] | null
  extra_sections: ExtraSection[] | null
  created_at: string
}

type BotDetail = {
  id: number
  name: string
  description: string | null
  tags: string | null
  status: string
  priority: number
}

const TABS = [
  { key: 'overview',     label: 'Overview',     icon: StickyNote },
  { key: 'inputs',       label: 'Inputs',       icon: Settings2 },
  { key: 'features',     label: 'Features',     icon: CheckCircle2 },
  { key: 'screenshots',  label: 'Screenshots',  icon: Image },
  { key: 'ga',           label: 'GA / ML Code', icon: FlaskConical },
  { key: 'code',         label: 'Code',         icon: Code2 },
  { key: 'extra',        label: 'Extra',        icon: Plus },
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

  // Version form
  const [showNewVersion, setShowNewVersion] = useState(false)
  const [newVersionName, setNewVersionName] = useState('')

  // GA & Code data
  const [gaRuns, setGaRuns] = useState<GAEntry[]>([])
  const [codeEntries, setCodeEntries] = useState<CodeEntry[]>([])

  const selectedVersion = versions.find(v => v.id === selectedVersionId) ?? null

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

  async function loadVersionDetails(vId: number) {
    const [gaRes, codeRes] = await Promise.allSettled([
      api.get(`/api/bots/${botId}/versions/${vId}/ga`),
      api.get(`/api/bots/${botId}/versions/${vId}/code`),
    ])
    if (gaRes.status === 'fulfilled') setGaRuns(gaRes.value.data)
    if (codeRes.status === 'fulfilled') setCodeEntries(codeRes.value.data)
  }

  useEffect(() => { load() }, [botId])
  useEffect(() => { if (selectedVersionId) loadVersionDetails(selectedVersionId) }, [selectedVersionId])

  async function createVersion() {
    if (!newVersionName.trim()) return
    const { data } = await api.post(`/api/bots/${botId}/versions`, {
      version_name: newVersionName,
      inputs: selectedVersion?.inputs ?? [],   // inherit inputs from previous version
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
    // refresh
    const { data } = await api.get(`/api/bots/${botId}/versions`)
    setVersions(data)
    addToast('Saved', 'success')
  }

  if (loading) return <div className="py-20 text-center text-slate-400">Loading...</div>
  if (!bot) return <div className="py-20 text-center text-slate-400">Bot not found</div>

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <button onClick={() => router.push('/dashboard/bots')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ChevronLeft className="h-4 w-4" /> Back to Bots
      </button>

      {/* Bot header */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{bot.name}</h1>
            {bot.description && <p className="mt-1 text-slate-500 text-sm">{bot.description}</p>}
            {bot.tags && (
              <div className="flex flex-wrap gap-1 mt-2">
                {bot.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                  <span key={tag} className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs text-blue-700">{tag}</span>
                ))}
              </div>
            )}
          </div>
          <span className={`self-start px-3 py-1 rounded-full text-xs font-medium capitalize ${
            bot.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
            bot.status === 'experimental' ? 'bg-amber-100 text-amber-700' :
            'bg-slate-100 text-slate-600'
          }`}>{bot.status}</span>
        </div>
      </div>

      {/* Version selector */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Version:</label>
          <div className="relative">
            <select
              value={selectedVersionId ?? ''}
              onChange={e => setSelectedVersionId(Number(e.target.value))}
              className="appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 py-2 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              {versions.length === 0 && <option value="">No versions yet</option>}
              {versions.map(v => (
                <option key={v.id} value={v.id}>{v.version_name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-slate-400" />
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
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
            />
            <button onClick={createVersion} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">Add</button>
            <button onClick={() => setShowNewVersion(false)} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-100">Cancel</button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewVersion(true)}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-400 px-3 py-1.5 text-sm text-slate-600 hover:border-blue-400 hover:text-blue-600"
          >
            <Plus className="h-3.5 w-3.5" /> New Version
          </button>
        )}
      </div>

      {selectedVersion ? (
        <>
          {/* Tab bar */}
          <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
            {TABS.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex shrink-0 items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />{tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <OverviewTab version={selectedVersion} onSave={saveVersionField} />
            )}

            {/* INPUTS */}
            {activeTab === 'inputs' && (
              <InputsTab version={selectedVersion} onSave={saveVersionField} />
            )}

            {/* FEATURES */}
            {activeTab === 'features' && (
              <FeaturesTab version={selectedVersion} onSave={saveVersionField} />
            )}

            {/* SCREENSHOTS */}
            {activeTab === 'screenshots' && (
              <ScreenshotsTab version={selectedVersion} onSave={saveVersionField} />
            )}

            {/* GA / ML CODE */}
            {activeTab === 'ga' && (
              <GATab botId={botId} versionId={selectedVersionId!} gaRuns={gaRuns} reload={() => loadVersionDetails(selectedVersionId!)} addToast={addToast} />
            )}

            {/* CODE */}
            {activeTab === 'code' && (
              <CodeTab botId={botId} versionId={selectedVersionId!} codeEntries={codeEntries} reload={() => loadVersionDetails(selectedVersionId!)} addToast={addToast} />
            )}

            {/* EXTRA SECTIONS */}
            {activeTab === 'extra' && (
              <ExtraTab version={selectedVersion} onSave={saveVersionField} />
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-16 rounded-xl border-2 border-dashed border-slate-200">
          <p className="text-slate-500">No versions yet. Create the first version above.</p>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// OVERVIEW TAB
// ──────────────────────────────────────────────
function OverviewTab({ version, onSave }: { version: Version; onSave: (f: string, v: unknown) => void }) {
  const [notes, setNotes] = useState(version.notes ?? '')
  const [changes, setChanges] = useState(version.changes_description ?? '')

  useEffect(() => {
    setNotes(version.notes ?? '')
    setChanges(version.changes_description ?? '')
  }, [version.id])

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Version Notes</label>
        <textarea
          rows={4}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="General notes about this version..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 resize-y"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Changes from Previous Version</label>
        <textarea
          rows={4}
          value={changes}
          onChange={e => setChanges(e.target.value)}
          placeholder="What was changed, improved or removed compared to the previous version..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 resize-y"
        />
      </div>
      <button
        onClick={() => { onSave('notes', notes); onSave('changes_description', changes) }}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        <Save className="h-4 w-4" /> Save
      </button>
    </div>
  )
}

// ──────────────────────────────────────────────
// INPUTS TAB
// ──────────────────────────────────────────────
function InputsTab({ version, onSave }: { version: Version; onSave: (f: string, v: unknown) => void }) {
  const [inputs, setInputs] = useState<Input[]>(version.inputs ?? [])

  useEffect(() => { setInputs(version.inputs ?? []) }, [version.id])

  function addInput() {
    setInputs(prev => [...prev, { name: '', type: 'number', value: '', description: '' }])
  }

  function updateInput(i: number, field: keyof Input, val: string) {
    setInputs(prev => prev.map((inp, idx) => idx === i ? { ...inp, [field]: val } : inp))
  }

  function removeInput(i: number) {
    setInputs(prev => prev.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">Strategy Inputs</h3>
          <p className="text-xs text-slate-500">All configurable parameters for this version. When you create a new version, these are automatically copied.</p>
        </div>
        <button onClick={addInput} className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-400 px-3 py-1.5 text-sm text-slate-600 hover:border-blue-400 hover:text-blue-600">
          <Plus className="h-3.5 w-3.5" /> Add Input
        </button>
      </div>

      {inputs.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No inputs defined yet.</p>}

      <div className="space-y-2">
        {inputs.map((inp, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-start rounded-lg border border-slate-200 p-3">
            <input
              placeholder="Name"
              value={inp.name}
              onChange={e => updateInput(i, 'name', e.target.value)}
              className="col-span-3 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
            />
            <select
              value={inp.type}
              onChange={e => updateInput(i, 'type', e.target.value)}
              className="col-span-2 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
            >
              <option>number</option>
              <option>string</option>
              <option>boolean</option>
              <option>array</option>
            </select>
            <input
              placeholder="Value"
              value={inp.value}
              onChange={e => updateInput(i, 'value', e.target.value)}
              className="col-span-2 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
            />
            <input
              placeholder="Description"
              value={inp.description}
              onChange={e => updateInput(i, 'description', e.target.value)}
              className="col-span-4 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
            />
            <button onClick={() => removeInput(i)} className="col-span-1 flex justify-center rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => onSave('inputs', inputs)}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        <Save className="h-4 w-4" /> Save Inputs
      </button>
    </div>
  )
}

// ──────────────────────────────────────────────
// FEATURES TAB
// ──────────────────────────────────────────────
function FeaturesTab({ version, onSave }: { version: Version; onSave: (f: string, v: unknown) => void }) {
  const [implemented, setImplemented] = useState<string[]>(version.implemented_features ?? [])
  const [planned, setPlanned] = useState<string[]>(version.planned_changes ?? [])
  const [newImpl, setNewImpl] = useState('')
  const [newPlan, setNewPlan] = useState('')

  useEffect(() => {
    setImplemented(version.implemented_features ?? [])
    setPlanned(version.planned_changes ?? [])
  }, [version.id])

  function addItem(list: string[], setList: (v: string[]) => void, val: string, setVal: (v: string) => void) {
    if (!val.trim()) return
    setList([...list, val.trim()])
    setVal('')
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Implemented */}
      <div className="space-y-3">
        <h3 className="font-semibold text-emerald-700 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Implemented</h3>
        <div className="space-y-1">
          {implemented.map((item, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2">
              <span className="flex-1 text-sm text-slate-700">{item}</span>
              <button onClick={() => setImplemented(implemented.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-400"><X className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            placeholder="Add implemented feature..."
            value={newImpl}
            onChange={e => setNewImpl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem(implemented, setImplemented, newImpl, setNewImpl)}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
          />
          <button onClick={() => addItem(implemented, setImplemented, newImpl, setNewImpl)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700"><Plus className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Planned */}
      <div className="space-y-3">
        <h3 className="font-semibold text-amber-700 flex items-center gap-2"><Clock className="h-4 w-4" /> Planned Changes</h3>
        <div className="space-y-1">
          {planned.map((item, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2">
              <span className="flex-1 text-sm text-slate-700">{item}</span>
              <button onClick={() => setPlanned(planned.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-400"><X className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            placeholder="Add planned change..."
            value={newPlan}
            onChange={e => setNewPlan(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem(planned, setPlanned, newPlan, setNewPlan)}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-amber-500"
          />
          <button onClick={() => addItem(planned, setPlanned, newPlan, setNewPlan)} className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm text-white hover:bg-amber-600"><Plus className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="md:col-span-2">
        <button
          onClick={() => { onSave('implemented_features', implemented); onSave('planned_changes', planned) }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Save className="h-4 w-4" /> Save Features
        </button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// SCREENSHOTS TAB
// ──────────────────────────────────────────────
function ScreenshotsTab({ version, onSave }: { version: Version; onSave: (f: string, v: unknown) => void }) {
  const [screenshots, setScreenshots] = useState<Screenshot[]>(version.screenshots ?? [])

  useEffect(() => { setScreenshots(version.screenshots ?? []) }, [version.id])

  function addScreenshot() {
    setScreenshots(prev => [...prev, { title: '', gdrive_url: '', description: '' }])
  }

  function update(i: number, field: keyof Screenshot, val: string) {
    setScreenshots(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s))
  }

  // Convert Google Drive share URL to embed/preview URL
  function toPreviewUrl(url: string) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
    if (match) return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`
    return url
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">Screenshots</h3>
          <p className="text-xs text-slate-500">Paste Google Drive share links. They will be embedded as images.</p>
        </div>
        <button onClick={addScreenshot} className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-400 px-3 py-1.5 text-sm hover:border-blue-400 hover:text-blue-600">
          <Plus className="h-3.5 w-3.5" /> Add Screenshot
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {screenshots.map((s, i) => (
          <div key={i} className="rounded-xl border border-slate-200 overflow-hidden">
            {s.gdrive_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={toPreviewUrl(s.gdrive_url)}
                alt={s.title || 'screenshot'}
                className="w-full h-48 object-cover bg-slate-100"
                onError={e => (e.currentTarget.style.display = 'none')}
              />
            )}
            {!s.gdrive_url && (
              <div className="h-32 bg-slate-100 flex items-center justify-center">
                <Image className="h-8 w-8 text-slate-300" />
              </div>
            )}
            <div className="p-3 space-y-2">
              <input
                placeholder="Title"
                value={s.title}
                onChange={e => update(i, 'title', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
              />
              <input
                placeholder="Google Drive share URL"
                value={s.gdrive_url}
                onChange={e => update(i, 'gdrive_url', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
              />
              {s.gdrive_url && (
                <a href={s.gdrive_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                  <ExternalLink className="h-3 w-3" /> Open in Drive
                </a>
              )}
              <input
                placeholder="Description"
                value={s.description}
                onChange={e => update(i, 'description', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
              />
              <button onClick={() => setScreenshots(prev => prev.filter((_, idx) => idx !== i))} className="text-xs text-red-500 hover:underline">Remove</button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => onSave('screenshots', screenshots)}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        <Save className="h-4 w-4" /> Save Screenshots
      </button>
    </div>
  )
}

// ──────────────────────────────────────────────
// GA / ML CODE TAB
// ──────────────────────────────────────────────
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
        run_name: form.run_name,
        notes: form.notes,
        parameter_sets: form.parameter_sets ? JSON.parse(form.parameter_sets) : null,
        optimization_results: form.optimization_results ? JSON.parse(form.optimization_results) : null,
        best_chromosomes: form.best_chromosomes ? JSON.parse(form.best_chromosomes) : null,
      })
      addToast('GA run added', 'success')
      setShowForm(false)
      reload()
    } catch (e) { addToast('Error: check JSON fields', 'error') }
    finally { setSaving(false) }
  }

  async function deleteRun(id: number) {
    await api.delete(`/api/bots/${botId}/versions/${versionId}/ga/${id}`)
    reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">GA / ML Algorithm Runs</h3>
          <p className="text-xs text-slate-500">Store GA optimizations, XGBoost, LSTM or any algorithm run results.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-400 px-3 py-1.5 text-sm hover:border-blue-400 hover:text-blue-600">
          <Plus className="h-3.5 w-3.5" /> Add Run
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50">
          <div className="grid gap-3 sm:grid-cols-2">
            <input placeholder="Run name (e.g. GA Run 1 - April)" value={form.run_name} onChange={e => setForm(f => ({...f, run_name: e.target.value}))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
            <input placeholder="Algorithm type (GA, XGBoost, LSTM, etc.)" value={form.algo_type} onChange={e => setForm(f => ({...f, algo_type: e.target.value}))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
          </div>
          <textarea placeholder="Notes" rows={2} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
          <textarea placeholder='Parameter sets (JSON array, e.g. [{"period": 14}])' rows={3} value={form.parameter_sets} onChange={e => setForm(f => ({...f, parameter_sets: e.target.value}))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono outline-none focus:border-blue-500" />
          <textarea placeholder='Best chromosomes / model params (JSON)' rows={3} value={form.best_chromosomes} onChange={e => setForm(f => ({...f, best_chromosomes: e.target.value}))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono outline-none focus:border-blue-500" />
          <textarea placeholder='Optimization results (JSON)' rows={3} value={form.optimization_results} onChange={e => setForm(f => ({...f, optimization_results: e.target.value}))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono outline-none focus:border-blue-500" />
          <div className="flex gap-2">
            <button onClick={submit} disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">{saving ? 'Saving...' : 'Save Run'}</button>
            <button onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-100">Cancel</button>
          </div>
        </div>
      )}

      {gaRuns.length === 0 && !showForm && <p className="py-8 text-center text-sm text-slate-400">No algorithm runs stored yet.</p>}

      <div className="space-y-3">
        {gaRuns.map(run => (
          <div key={run.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-slate-800">{run.run_name || `Run #${run.id}`}</span>
              <button onClick={() => deleteRun(run.id)} className="text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
            </div>
            {run.notes && <p className="text-sm text-slate-500 mb-2">{run.notes}</p>}
            {run.parameter_sets && (
              <details className="mt-2">
                <summary className="text-xs font-medium text-slate-600 cursor-pointer">Parameter Sets</summary>
                <pre className="mt-1 rounded bg-slate-100 p-2 text-xs overflow-x-auto">{JSON.stringify(run.parameter_sets, null, 2)}</pre>
              </details>
            )}
            {run.best_chromosomes && (
              <details className="mt-2">
                <summary className="text-xs font-medium text-slate-600 cursor-pointer">Best Chromosomes / Params</summary>
                <pre className="mt-1 rounded bg-slate-100 p-2 text-xs overflow-x-auto">{JSON.stringify(run.best_chromosomes, null, 2)}</pre>
              </details>
            )}
            {run.optimization_results && (
              <details className="mt-2">
                <summary className="text-xs font-medium text-slate-600 cursor-pointer">Optimization Results</summary>
                <pre className="mt-1 rounded bg-slate-100 p-2 text-xs overflow-x-auto">{JSON.stringify(run.optimization_results, null, 2)}</pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// CODE TAB
// ──────────────────────────────────────────────
function CodeTab({ botId, versionId, codeEntries, reload, addToast }: {
  botId: string; versionId: number; codeEntries: CodeEntry[]
  reload: () => void; addToast: (m: string, t: 'success'|'error'|'info'|'warning') => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ language: 'python', filename: '', code_content: '', description: '' })
  const [saving, setSaving] = useState(false)

  async function submit() {
    setSaving(true)
    try {
      await api.post(`/api/bots/${botId}/versions/${versionId}/code`, form)
      addToast('Code added', 'success')
      setShowForm(false)
      setForm({ language: 'python', filename: '', code_content: '', description: '' })
      reload()
    } finally { setSaving(false) }
  }

  async function deleteEntry(id: number) {
    await api.delete(`/api/bots/${botId}/versions/${versionId}/code/${id}`)
    reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">Code Storage</h3>
          <p className="text-xs text-slate-500">Store strategy code, scripts, Pine Script, MQL5, Python etc.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-400 px-3 py-1.5 text-sm hover:border-blue-400 hover:text-blue-600">
          <Plus className="h-3.5 w-3.5" /> Add Code
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <select value={form.language} onChange={e => setForm(f => ({...f, language: e.target.value}))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500">
              <option value="python">Python</option>
              <option value="pinescript">Pine Script</option>
              <option value="mql5">MQL5</option>
              <option value="other">Other</option>
            </select>
            <input placeholder="Filename (e.g. strategy_v2.py)" value={form.filename} onChange={e => setForm(f => ({...f, filename: e.target.value}))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
          </div>
          <input placeholder="Description" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
          <textarea
            placeholder="Paste code here..."
            rows={8}
            value={form.code_content}
            onChange={e => setForm(f => ({...f, code_content: e.target.value}))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono outline-none focus:border-blue-500"
          />
          <div className="flex gap-2">
            <button onClick={submit} disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">{saving ? 'Saving...' : 'Save Code'}</button>
            <button onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-100">Cancel</button>
          </div>
        </div>
      )}

      {codeEntries.length === 0 && !showForm && <p className="py-8 text-center text-sm text-slate-400">No code stored yet.</p>}

      <div className="space-y-3">
        {codeEntries.map(entry => (
          <div key={entry.id} className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between bg-slate-800 px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="rounded bg-blue-700 px-2 py-0.5 text-xs text-white font-mono">{entry.language}</span>
                <span className="text-sm text-slate-200 font-mono">{entry.filename || 'Untitled'}</span>
              </div>
              <button onClick={() => deleteEntry(entry.id)} className="text-slate-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
            </div>
            {entry.description && <p className="px-4 py-2 text-xs text-slate-500 bg-slate-50 border-b">{entry.description}</p>}
            <pre className="overflow-x-auto p-4 text-xs bg-slate-900 text-slate-100 max-h-64">{entry.code_content}</pre>
          </div>
        ))}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// EXTRA SECTIONS TAB
// ──────────────────────────────────────────────
function ExtraTab({ version, onSave }: { version: Version; onSave: (f: string, v: unknown) => void }) {
  const [sections, setSections] = useState<ExtraSection[]>(version.extra_sections ?? [])

  useEffect(() => { setSections(version.extra_sections ?? []) }, [version.id])

  function addSection() {
    setSections(prev => [...prev, { title: '', content: '' }])
  }

  function update(i: number, field: keyof ExtraSection, val: string) {
    setSections(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">Extra Sections</h3>
          <p className="text-xs text-slate-500">Add any freeform section you need — risk analysis, trade journal, links, etc.</p>
        </div>
        <button onClick={addSection} className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-400 px-3 py-1.5 text-sm hover:border-blue-400 hover:text-blue-600">
          <Plus className="h-3.5 w-3.5" /> Add Section
        </button>
      </div>

      {sections.length === 0 && <p className="text-center py-8 text-sm text-slate-400">No extra sections yet.</p>}

      <div className="space-y-4">
        {sections.map((s, i) => (
          <div key={i} className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <input
                placeholder="Section title"
                value={s.title}
                onChange={e => update(i, 'title', e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium outline-none focus:border-blue-500"
              />
              <button onClick={() => setSections(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              rows={4}
              placeholder="Content..."
              value={s.content}
              onChange={e => update(i, 'content', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 resize-y"
            />
          </div>
        ))}
      </div>

      <button
        onClick={() => onSave('extra_sections', sections)}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        <Save className="h-4 w-4" /> Save Sections
      </button>
    </div>
  )
}

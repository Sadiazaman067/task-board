import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Tag, Users, X } from 'lucide-react'
import { SWATCHES } from '../types'
import type { Label, Member } from '../types'
import { Avatar } from './Avatar'
import { inputCls } from './fields'

interface Props {
  members: Member[]
  labels: Label[]
  onClose: () => void
  addMember: (name: string, color: string) => Promise<string | null>
  removeMember: (id: string) => Promise<string | null>
  addLabel: (name: string, color: string) => Promise<string | null>
  removeLabel: (id: string) => Promise<string | null>
}

function AddForm({ placeholder, max, onAdd }: { placeholder: string; max: number; onAdd: (name: string, color: string) => Promise<string | null> }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(SWATCHES[0])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const err = await onAdd(name.trim(), color)
    setSaving(false)
    setError(err)
    if (!err) {
      setName('')
      // rotate to the next color so new items look different by default
      setColor(SWATCHES[(SWATCHES.indexOf(color) + 1) % SWATCHES.length])
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex gap-2">
        <input value={name} maxLength={max} onChange={(e) => setName(e.target.value)} placeholder={placeholder} className={inputCls} />
        <button disabled={saving || !name.trim()} className="rounded-lg bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40">
          Add
        </button>
      </div>
      <div className="flex gap-1.5" role="radiogroup" aria-label="Color">
        {SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={color === c}
            aria-label={c}
            onClick={() => setColor(c)}
            className={`h-5 w-5 rounded-full transition ${color === c ? 'ring-2 ring-slate-900 ring-offset-2' : 'hover:scale-110'}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </form>
  )
}

export function WorkspaceModal({ members, labels, onClose, addMember, removeMember, addLabel, removeLabel }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/30 backdrop-blur-[2px] animate-fade-in sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl animate-pop-in sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Team and labels"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold">Team & labels</h2>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <section className="mb-8">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold"><Users size={14} /> Team members</h3>
          <AddForm placeholder="Name, e.g. Maya Patel" max={60} onAdd={addMember} />
          <ul className="mt-3 divide-y divide-slate-100">
            {members.map((m) => (
              <li key={m.id} className="group flex items-center gap-2.5 py-2">
                <Avatar member={m} size={26} />
                <span className="text-sm">{m.name}</span>
                <button onClick={() => removeMember(m.id)} className="ml-auto rounded p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-600" aria-label={`Remove ${m.name}`}>
                  <X size={14} />
                </button>
              </li>
            ))}
            {members.length === 0 && <li className="py-2 text-xs text-slate-400">No teammates yet. Add a few to start assigning work.</li>}
          </ul>
        </section>

        <section>
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold"><Tag size={14} /> Labels</h3>
          <AddForm placeholder="Label, e.g. Bug, Feature, Design" max={30} onAdd={addLabel} />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {labels.map((l) => (
              <span key={l.id} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pr-1 pl-2.5 text-xs font-medium text-slate-700">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
                {l.name}
                <button onClick={() => removeLabel(l.id)} className="rounded-full p-0.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600" aria-label={`Delete label ${l.name}`}>
                  <X size={12} />
                </button>
              </span>
            ))}
            {labels.length === 0 && <p className="text-xs text-slate-400">No labels yet.</p>}
          </div>
        </section>
      </div>
    </div>
  )
}

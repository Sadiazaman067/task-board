import type { ReactNode } from 'react'
import { Check, Plus } from 'lucide-react'
import { COLUMNS, PRIORITIES } from '../types'
import type { Label, Member, Priority, Status } from '../types'
import { Avatar } from './Avatar'

const PRIORITY_ACTIVE: Record<Priority, string> = {
  low: 'bg-sky-50 text-sky-700 ring-sky-300',
  normal: 'bg-slate-100 text-slate-800 ring-slate-300',
  high: 'bg-rose-50 text-rose-700 ring-rose-300',
}

export const inputCls =
  'w-full rounded-lg border-0 bg-white px-3 py-2 text-sm ring-1 ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </div>
  )
}

export function PriorityPicker({ value, onChange }: { value: Priority; onChange: (p: Priority) => void }) {
  return (
    <div className="flex gap-1.5" role="radiogroup" aria-label="Priority">
      {PRIORITIES.map((p) => (
        <button
          key={p}
          type="button"
          role="radio"
          aria-checked={value === p}
          onClick={() => onChange(p)}
          className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium capitalize ring-1 transition ${
            value === p ? PRIORITY_ACTIVE[p] : 'bg-white text-slate-500 ring-slate-200 hover:bg-slate-50'
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  )
}

export function StatusSelect({ value, onChange }: { value: Status; onChange: (s: Status) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as Status)} className={inputCls} aria-label="Status">
      {COLUMNS.map((c) => (
        <option key={c.id} value={c.id}>
          {c.title}
        </option>
      ))}
    </select>
  )
}

const chipCls = (on: boolean) =>
  `inline-flex items-center gap-1.5 rounded-full py-1 pr-2.5 pl-1 text-xs font-medium ring-1 transition ${
    on ? 'bg-indigo-50 text-indigo-700 ring-indigo-300' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
  }`

function EmptyPick({ text, onManage }: { text: string; onManage: () => void }) {
  return (
    <button
      type="button"
      onClick={onManage}
      className="inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-2.5 py-1.5 text-xs text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
    >
      <Plus size={12} /> {text}
    </button>
  )
}

export function MemberPicker({
  members, selected, onToggle, onManage,
}: { members: Member[]; selected: string[]; onToggle: (id: string) => void; onManage: () => void }) {
  if (members.length === 0) return <EmptyPick text="Add team members" onManage={onManage} />
  return (
    <div className="flex flex-wrap gap-1.5">
      {members.map((m) => {
        const on = selected.includes(m.id)
        return (
          <button key={m.id} type="button" onClick={() => onToggle(m.id)} className={chipCls(on)} aria-pressed={on}>
            <Avatar member={m} size={20} />
            {m.name}
            {on && <Check size={12} />}
          </button>
        )
      })}
    </div>
  )
}

export function LabelPicker({
  labels, selected, onToggle, onManage,
}: { labels: Label[]; selected: string[]; onToggle: (id: string) => void; onManage: () => void }) {
  if (labels.length === 0) return <EmptyPick text="Create labels" onManage={onManage} />
  return (
    <div className="flex flex-wrap gap-1.5">
      {labels.map((l) => {
        const on = selected.includes(l.id)
        return (
          <button key={l.id} type="button" onClick={() => onToggle(l.id)} className={`${chipCls(on)} pl-2.5`} aria-pressed={on}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
            {l.name}
            {on && <Check size={12} />}
          </button>
        )
      })}
    </div>
  )
}

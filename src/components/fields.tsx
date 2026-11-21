import type { ReactNode } from 'react'
import { COLUMNS, PRIORITIES } from '../types'
import type { Priority, Status } from '../types'

const PRIORITY_ACTIVE: Record<Priority, string> = {
  low: 'bg-sky-50 text-sky-700 ring-sky-300',
  normal: 'bg-slate-100 text-slate-800 ring-slate-300',
  high: 'bg-rose-50 text-rose-700 ring-rose-300',
}

export const inputCls =
  'w-full rounded-lg border-0 bg-white px-3 py-2 text-sm ring-1 ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
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
    <select value={value} onChange={(e) => onChange(e.target.value as Status)} className={inputCls}>
      {COLUMNS.map((c) => (
        <option key={c.id} value={c.id}>
          {c.title}
        </option>
      ))}
    </select>
  )
}

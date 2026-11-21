import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, ChevronDown, ListTodo, Search, X } from 'lucide-react'
import { PRIORITIES } from '../types'
import type { Label, Member, Priority } from '../types'
import { Avatar } from './Avatar'

export interface Filters {
  search: string
  priorities: Priority[]
  members: string[]
  labels: string[]
}

export const EMPTY_FILTERS: Filters = { search: '', priorities: [], members: [], labels: [] }

export const hasFilters = (f: Filters) =>
  !!f.search.trim() || f.priorities.length > 0 || f.members.length > 0 || f.labels.length > 0

interface Option {
  id: string
  name: string
  icon?: ReactNode
}

const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id]

function FilterMenu({ label, options, selected, onChange, empty }: {
  label: string
  options: Option[]
  selected: string[]
  onChange: (ids: string[]) => void
  empty: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const active = selected.length > 0

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ring-1 transition ${
          active ? 'bg-indigo-50 text-indigo-700 ring-indigo-200' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
        }`}
        aria-expanded={open}
      >
        {label}
        {active && <span className="rounded bg-indigo-600 px-1 text-[10px] text-white">{selected.length}</span>}
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-1.5 w-52 rounded-xl bg-white p-1 shadow-lg ring-1 ring-slate-200 animate-pop-in">
          {options.length === 0 && <p className="px-2.5 py-2 text-xs text-slate-400">{empty}</p>}
          {options.map((o) => (
            <label key={o.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-slate-50">
              <input
                type="checkbox"
                checked={selected.includes(o.id)}
                onChange={() => onChange(toggle(selected, o.id))}
                className="h-3.5 w-3.5 rounded accent-indigo-600"
              />
              {o.icon}
              <span className="truncate capitalize">{o.name}</span>
            </label>
          ))}
          {active && (
            <button onClick={() => onChange([])} className="mt-1 w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-500 hover:bg-slate-50">
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function Stat({ icon, value, label, tone }: { icon: ReactNode; value: number; label: string; tone: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 ring-1 ring-slate-200">
      <span className={tone}>{icon}</span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  )
}

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
  members: Member[]
  labels: Label[]
  stats: { total: number; done: number; overdue: number }
  shown: number
}

export function Toolbar({ filters, onChange, members, labels, stats, shown }: Props) {
  const searchRef = useRef<HTMLInputElement>(null)
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })

  // press "/" to jump to search (like GitHub / Linear)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0

  return (
    <div className="mb-5 space-y-3">
      {/* stats */}
      <div className="flex flex-wrap items-center gap-2">
        <Stat icon={<ListTodo size={14} />} value={stats.total} label="tasks" tone="text-slate-400" />
        <Stat icon={<CheckCircle2 size={14} />} value={stats.done} label="done" tone="text-emerald-500" />
        <Stat icon={<AlertTriangle size={14} />} value={stats.overdue} label="overdue" tone={stats.overdue ? 'text-rose-500' : 'text-slate-300'} />
        <div className="flex min-w-40 flex-1 items-center gap-2 sm:max-w-56">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-medium tabular-nums text-slate-500">{pct}%</span>
        </div>
      </div>

      {/* search + filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search size={14} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-slate-400" />
          <input
            ref={searchRef}
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            onKeyDown={(e) => e.key === 'Escape' && (set({ search: '' }), e.currentTarget.blur())}
            placeholder="Search tasks…"
            className="w-full rounded-lg border-0 bg-white py-1.5 pr-8 pl-8 text-sm ring-1 ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <kbd className="absolute top-1/2 right-2 -translate-y-1/2 rounded bg-slate-100 px-1.5 text-[10px] text-slate-400">/</kbd>
        </div>

        <FilterMenu
          label="Priority"
          options={PRIORITIES.map((p) => ({ id: p, name: p }))}
          selected={filters.priorities}
          onChange={(ids) => set({ priorities: ids as Priority[] })}
          empty=""
        />
        <FilterMenu
          label="Assignee"
          options={members.map((m) => ({ id: m.id, name: m.name, icon: <Avatar member={m} size={18} /> }))}
          selected={filters.members}
          onChange={(ids) => set({ members: ids })}
          empty="No team members yet"
        />
        <FilterMenu
          label="Label"
          options={labels.map((l) => ({ id: l.id, name: l.name, icon: <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} /> }))}
          selected={filters.labels}
          onChange={(ids) => set({ labels: ids })}
          empty="No labels yet"
        />

        {hasFilters(filters) && (
          <>
            <span className="text-xs text-slate-500">
              Showing <b className="text-slate-700">{shown}</b> of {stats.total}
            </span>
            <button onClick={() => onChange(EMPTY_FILTERS)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800">
              <X size={12} /> Clear filters
            </button>
          </>
        )}
      </div>
    </div>
  )
}

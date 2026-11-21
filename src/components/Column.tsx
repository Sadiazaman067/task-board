import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import type { ColumnDef, Status, Task } from '../types'
import { SortableTaskCard } from './TaskCard'

interface Props {
  column: ColumnDef
  tasks: Task[]
  highlighted: boolean
  onCreate: (status: Status, title: string) => Promise<boolean>
  onOpen: (id: string) => void
  onAddClick: (status: Status) => void
}

export function Column({ column, tasks, highlighted, onCreate, onOpen, onAddClick }: Props) {
  const { setNodeRef } = useDroppable({ id: column.id })
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit() {
    const t = title.trim()
    if (!t) return setAdding(false)
    setSaving(true)
    const ok = await onCreate(column.id, t)
    setSaving(false)
    if (ok) setTitle('') // stay open so you can add several in a row
  }

  function cancel() {
    setAdding(false)
    setTitle('')
  }

  return (
    <section className="flex w-[85vw] shrink-0 snap-start flex-col rounded-2xl bg-slate-100/80 p-3 sm:w-72 lg:w-auto lg:min-w-0 lg:flex-1">
      <header className="mb-3 flex items-center gap-2 px-1">
        <span className={`h-2 w-2 rounded-full ${column.dot}`} />
        <h2 className="text-sm font-semibold text-slate-700">{column.title}</h2>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
          {tasks.length}
        </span>
        <button
          onClick={() => onAddClick(column.id)}
          className="ml-auto rounded-md p-1 text-slate-400 transition hover:bg-white hover:text-slate-700"
          aria-label={`Add task to ${column.title}`}
        >
          <Plus size={16} />
        </button>
      </header>

      <div
        ref={setNodeRef}
        className={`flex min-h-32 flex-1 flex-col gap-2 rounded-xl p-1 transition-colors ${
          highlighted ? 'bg-indigo-50 ring-2 ring-indigo-200' : ''
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((t) => (
            <SortableTaskCard key={t.id} task={t} onOpen={onOpen} />
          ))}
        </SortableContext>

        {tasks.length === 0 && !adding && (
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 px-4 py-8 text-center text-xs text-slate-400">
            {column.id === 'done' ? 'Finished work lands here' : 'Drag a task here or add one'}
          </div>
        )}

        {adding && (
          <div className="rounded-xl bg-white p-2 shadow-sm ring-1 ring-indigo-300">
            <input
              autoFocus
              value={title}
              disabled={saving}
              maxLength={200}
              placeholder="Task title…"
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void submit()
                if (e.key === 'Escape') cancel()
              }}
              onBlur={() => !title.trim() && cancel()}
              className="w-full bg-transparent px-1 py-1 text-sm outline-none placeholder:text-slate-400"
            />
            <p className="px-1 pt-1 text-[11px] text-slate-400">Enter to add · Esc to cancel</p>
          </div>
        )}
      </div>

      {!adding && (
        <button
          onClick={() => setAdding(true)}
          className="mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-slate-500 transition hover:bg-white hover:text-slate-800"
        >
          <Plus size={14} /> Add task
        </button>
      )}
    </section>
  )
}

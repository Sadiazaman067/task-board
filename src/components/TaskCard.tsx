import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AlignLeft, CalendarDays } from 'lucide-react'
import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import type { Task } from '../types'

// only show priority when it's not "normal" (keeps cards calm, like Linear)
const PRIORITY_BADGE = {
  high: { label: 'High', cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
  low: { label: 'Low', cls: 'bg-sky-50 text-sky-700 ring-sky-200' },
  normal: null,
} as const

function dueInfo(due: string | null, done: boolean) {
  if (!due) return null
  const date = parseISO(due) // parses 'YYYY-MM-DD' as local time (no timezone off-by-one)
  const days = differenceInCalendarDays(date, new Date())
  const label = format(date, 'MMM d')
  const warn = 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'

  if (done) return { label, cls: 'text-slate-400' }
  if (days < 0) return { label: `Overdue · ${label}`, cls: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' }
  if (days === 0) return { label: 'Due today', cls: warn }
  if (days === 1) return { label: 'Due tomorrow', cls: warn }
  if (days <= 3) return { label: `Due ${label}`, cls: warn }
  return { label, cls: 'text-slate-500' }
}

export function TaskCardView({ task, overlay = false }: { task: Task; overlay?: boolean }) {
  const due = dueInfo(task.due_date, task.status === 'done')
  const badge = PRIORITY_BADGE[task.priority]
  const done = task.status === 'done'
  const hasMeta = due || task.description

  return (
    <article
      className={`rounded-xl bg-white p-3 ring-1 transition-shadow ${
        overlay
          ? 'rotate-2 cursor-grabbing shadow-xl ring-indigo-300'
          : 'cursor-pointer shadow-sm ring-slate-200 hover:shadow-md hover:ring-slate-300'
      }`}
    >
      {badge && (
        <span className={`mb-2 inline-block rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ${badge.cls}`}>
          {badge.label}
        </span>
      )}

      <h3 className={`text-sm font-medium leading-snug ${done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
        {task.title}
      </h3>

      {hasMeta && (
        <div className="mt-2.5 flex items-center gap-2">
          {due && (
            <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${due.cls}`}>
              <CalendarDays size={12} />
              {due.label}
            </span>
          )}
          {task.description && <AlignLeft size={13} className="text-slate-400" aria-label="Has description" />}
        </div>
      )}
    </article>
  )
}

export function SortableTaskCard({ task, onOpen }: { task: Task; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`touch-manipulation rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${isDragging ? 'opacity-40' : ''}`}
      onClick={() => onOpen(task.id)}
      {...attributes}
      {...listeners}
    >
      <TaskCardView task={task} />
    </div>
  )
}

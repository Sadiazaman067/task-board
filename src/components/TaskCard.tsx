import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CalendarDays } from 'lucide-react'
import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import type { Task } from '../types'

const PRIORITY_STYLES = {
  high: 'bg-rose-50 text-rose-700 ring-rose-200',
  normal: 'bg-slate-50 text-slate-600 ring-slate-200',
  low: 'bg-sky-50 text-sky-700 ring-sky-200',
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
  if (days <= 2) return { label: `Due ${label}`, cls: warn }
  return { label, cls: 'text-slate-500' }
}

export function TaskCardView({ task, overlay = false }: { task: Task; overlay?: boolean }) {
  const due = dueInfo(task.due_date, task.status === 'done')
  const done = task.status === 'done'

  return (
    <article
      className={`rounded-xl bg-white p-3 ring-1 transition-shadow ${
        overlay
          ? 'rotate-2 cursor-grabbing shadow-xl ring-indigo-300'
          : 'cursor-grab shadow-sm ring-slate-200 hover:shadow-md hover:ring-slate-300'
      }`}
    >
      <span
        className={`mb-2 inline-block rounded-md px-1.5 py-0.5 text-[11px] font-medium capitalize ring-1 ${PRIORITY_STYLES[task.priority]}`}
      >
        {task.priority}
      </span>

      <h3
        className={`text-sm font-medium leading-snug ${
          done ? 'text-slate-400 line-through' : 'text-slate-800'
        }`}
      >
        {task.title}
      </h3>

      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{task.description}</p>
      )}

      {due && (
        <div className={`mt-3 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${due.cls}`}>
          <CalendarDays size={12} />
          {due.label}
        </div>
      )}
    </article>
  )
}

export function SortableTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`touch-manipulation ${isDragging ? 'opacity-40' : ''}`}
      {...attributes}
      {...listeners}
    >
      <TaskCardView task={task} />
    </div>
  )
}

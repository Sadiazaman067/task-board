import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { ArrowRight, MessageSquare, Trash2, X } from 'lucide-react'
import { useTaskDetail } from '../hooks/useTaskDetail'
import type { TaskPatch } from '../hooks/useTasks'
import { statusTitle } from '../types'
import type { Activity, Task } from '../types'
import { Field, PriorityPicker, StatusSelect, inputCls } from './fields'

interface Props {
  task: Task
  onClose: () => void
  onUpdate: (id: string, patch: TaskPatch) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
}

const ago = (iso: string) => formatDistanceToNow(new Date(iso), { addSuffix: true })

function describe(a: Activity) {
  switch (a.action) {
    case 'created':
      return <>Created in <b>{statusTitle(a.to_value ?? 'todo')}</b></>
    case 'status_changed':
      return (
        <>
          Moved <b>{statusTitle(a.from_value ?? '')}</b>
          <ArrowRight size={12} className="mx-1 inline" />
          <b>{statusTitle(a.to_value ?? '')}</b>
        </>
      )
    case 'title_changed':
      return <>Renamed to <b>“{a.to_value}”</b></>
    case 'priority_changed':
      return <>Priority <b className="capitalize">{a.from_value}</b> → <b className="capitalize">{a.to_value}</b></>
    case 'due_date_changed':
      return a.to_value
        ? <>Due date set to <b>{format(parseISO(a.to_value), 'MMM d, yyyy')}</b></>
        : <>Removed the due date</>
    default:
      return a.action
  }
}

export function TaskDetailPanel({ task, onClose, onUpdate, onDelete }: Props) {
  // local drafts so typing doesn't hit the database on every keystroke (saved on blur)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [comment, setComment] = useState('')
  const [posting, setPosting] = useState(false)
  const detail = useTaskDetail(task.id, task.updated_at)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function saveTitle() {
    const t = title.trim()
    if (!t) return setTitle(task.title) // can't be empty, so put it back
    if (t !== task.title) void onUpdate(task.id, { title: t })
  }

  function saveDescription() {
    const d = description.trim() || null
    if (d !== task.description) void onUpdate(task.id, { description: d })
  }

  async function postComment(e: FormEvent) {
    e.preventDefault()
    const body = comment.trim()
    if (!body) return
    setPosting(true)
    if (await detail.addComment(body)) setComment('')
    setPosting(false)
  }

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-slate-900/20 animate-fade-in" onMouseDown={onClose}>
      <aside
        onMouseDown={(e) => e.stopPropagation()}
        className="flex h-full w-full flex-col bg-white shadow-2xl animate-slide-in sm:w-[460px]"
        role="dialog"
        aria-modal="true"
        aria-label="Task details"
      >
        {/* top bar */}
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
          <span className="text-xs text-slate-400">Created {ago(task.created_at)}</span>
          <div className="ml-auto flex items-center gap-1">
            {confirmDelete ? (
              <>
                <span className="mr-1 text-xs text-slate-500">Delete this task?</span>
                <button onClick={() => setConfirmDelete(false)} className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100">
                  Cancel
                </button>
                <button
                  onClick={async () => (await onDelete(task.id)) && onClose()}
                  className="rounded-md bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-500"
                >
                  Delete
                </button>
              </>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete task">
                <Trash2 size={16} />
              </button>
            )}
            <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {/* title + description */}
          <div className="space-y-2">
            <input
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              className="-mx-2 w-[calc(100%+1rem)] rounded-lg border-0 bg-transparent px-2 py-1 text-xl font-semibold hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Title"
            />
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={saveDescription}
              placeholder="Add a description…"
              className={`${inputCls} resize-none`}
              aria-label="Description"
            />
          </div>

          {/* properties */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status">
              <StatusSelect value={task.status} onChange={(status) => onUpdate(task.id, { status })} />
            </Field>
            <Field label="Due date">
              <input
                type="date"
                value={task.due_date ?? ''}
                onChange={(e) => onUpdate(task.id, { due_date: e.target.value || null })}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Priority">
            <PriorityPicker value={task.priority} onChange={(priority) => onUpdate(task.id, { priority })} />
          </Field>

          {detail.error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">Couldn't load details: {detail.error}</p>
          )}

          {/* comments */}
          <section>
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
              <MessageSquare size={14} /> Comments
              <span className="text-xs font-normal text-slate-400">{detail.comments.length}</span>
            </h3>
            {detail.loading ? (
              <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
            ) : detail.comments.length === 0 ? (
              <p className="text-xs text-slate-400">No comments yet. Start the conversation.</p>
            ) : (
              <ul className="space-y-3">
                {detail.comments.map((c) => (
                  <li key={c.id} className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="whitespace-pre-wrap text-sm text-slate-700">{c.body}</p>
                    <p className="mt-1 text-[11px] text-slate-400" title={format(new Date(c.created_at), 'PPpp')}>
                      {ago(c.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={postComment} className="mt-3 flex gap-2">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={2000}
                placeholder="Write a comment…"
                className={inputCls}
              />
              <button
                type="submit"
                disabled={posting || !comment.trim()}
                className="rounded-lg bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40"
              >
                Post
              </button>
            </form>
          </section>

          {/* activity timeline */}
          <section>
            <h3 className="mb-3 text-sm font-semibold">Activity</h3>
            {detail.loading ? (
              <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
            ) : (
              <ol className="relative space-y-3 border-l border-slate-200 pl-4">
                {detail.activity.map((a) => (
                  <li key={a.id} className="relative text-xs text-slate-600">
                    <span className="absolute top-1 -left-[21px] h-2 w-2 rounded-full bg-slate-300 ring-4 ring-white" />
                    <span className="[&_b]:font-medium [&_b]:text-slate-800">{describe(a)}</span>
                    <span className="text-slate-400"> · {ago(a.created_at)}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </aside>
    </div>
  )
}

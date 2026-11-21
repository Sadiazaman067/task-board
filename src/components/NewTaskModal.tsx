import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { X } from 'lucide-react'
import type { NewTask } from '../hooks/useTasks'
import type { Label, Member, Priority, Status } from '../types'
import { Field, LabelPicker, MemberPicker, PriorityPicker, StatusSelect, inputCls } from './fields'

interface Props {
  initialStatus: Status
  onClose: () => void
  onCreate: (task: NewTask) => Promise<boolean>
  members: Member[]
  labels: Label[]
  onManage: () => void
}

const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id]

export function NewTaskModal({ initialStatus, onClose, onCreate, members, labels, onManage }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<Status>(initialStatus)
  const [priority, setPriority] = useState<Priority>('normal')
  const [dueDate, setDueDate] = useState('')
  const [assignees, setAssignees] = useState<string[]>([])
  const [labelIds, setLabelIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    const ok = await onCreate({
      title: title.trim(),
      description: description.trim() || null,
      status,
      priority,
      due_date: dueDate || null,
      assignee_ids: assignees,
      label_ids: labelIds,
    })
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 p-0 backdrop-blur-[2px] animate-fade-in sm:items-center sm:p-4"
      onMouseDown={onClose}
    >
      <form
        onSubmit={submit}
        onMouseDown={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl animate-pop-in sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-task-title"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="new-task-title" className="text-base font-semibold">New task</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <input
            autoFocus
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full border-0 bg-transparent p-0 text-lg font-medium placeholder:text-slate-300 focus:outline-none"
          />
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description (optional)"
            className={`${inputCls} resize-none`}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status">
              <StatusSelect value={status} onChange={setStatus} />
            </Field>
            <Field label="Due date">
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label="Priority">
            <PriorityPicker value={priority} onChange={setPriority} />
          </Field>
          <Field label="Assignees">
            <MemberPicker members={members} selected={assignees} onToggle={(id) => setAssignees((a) => toggle(a, id))} onManage={onManage} />
          </Field>
          <Field label="Labels">
            <LabelPicker labels={labels} selected={labelIds} onToggle={(id) => setLabelIds((l) => toggle(l, id))} onManage={onManage} />
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-[#fff] shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Create task'}
          </button>
        </div>
      </form>
    </div>
  )
}

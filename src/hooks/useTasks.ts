import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Priority, Status, Task } from '../types'

export interface NewTask {
  title: string
  status: Status
  description?: string | null
  priority?: Priority
  due_date?: string | null
  assignee_ids?: string[]
  label_ids?: string[]
}

export type TaskPatch = Partial<
  Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'due_date' | 'position'>
>

// fetch each task together with its assignee + label ids in ONE request (PostgREST embedding)
const TASK_SELECT = '*, task_assignees(member_id), task_labels(label_id)'
const GAP = 1000

export function useTasks(ready: boolean) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('tasks')
      .select(TASK_SELECT)
      .order('position', { ascending: true })
    if (error) setError(error.message)
    else setTasks((data ?? []) as Task[])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (ready) void load()
  }, [ready, load])

  const patchLocal = (id: string, fn: (t: Task) => Task) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? fn(t) : t)))

  // position for a task added to the bottom of a column
  const endOf = useCallback(
    (status: Status) => {
      const inColumn = tasks.filter((t) => t.status === status)
      return inColumn.length ? Math.max(...inColumn.map((t) => t.position)) + GAP : GAP
    },
    [tasks],
  )

  const createTask = useCallback(
    async ({ assignee_ids = [], label_ids = [], ...input }: NewTask) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...input, position: endOf(input.status) })
        .select(TASK_SELECT)
        .single()

      if (error) {
        setActionError(`Couldn't create task: ${error.message}`)
        return false
      }
      const task = data as Task

      const [a, l] = await Promise.all([
        assignee_ids.length
          ? supabase.from('task_assignees').insert(assignee_ids.map((member_id) => ({ task_id: task.id, member_id })))
          : { error: null },
        label_ids.length
          ? supabase.from('task_labels').insert(label_ids.map((label_id) => ({ task_id: task.id, label_id })))
          : { error: null },
      ])
      if (a.error || l.error) setActionError('Task created, but some assignees/labels failed to save.')

      setTasks((prev) => [
        ...prev,
        {
          ...task,
          task_assignees: a.error ? [] : assignee_ids.map((member_id) => ({ member_id })),
          task_labels: l.error ? [] : label_ids.map((label_id) => ({ label_id })),
        },
      ])
      return true
    },
    [endOf],
  )

  // optimistic: update the UI instantly, then save. if saving fails, reload from the db.
  const updateTask = useCallback(
    async (id: string, patch: TaskPatch) => {
      const current = tasks.find((t) => t.id === id)
      // changing status from the detail panel? drop it at the bottom of the new column
      if (current && patch.status && patch.status !== current.status && patch.position === undefined) {
        patch = { ...patch, position: endOf(patch.status) }
      }

      patchLocal(id, (t) => ({ ...t, ...patch }))

      const { data, error } = await supabase.from('tasks').update(patch).eq('id', id).select(TASK_SELECT).single()

      if (error) {
        setActionError("Couldn't save that change, so the board was refreshed.")
        void load()
        return false
      }
      // swap in the saved row (fresh updated_at tells the detail panel to refresh activity)
      patchLocal(id, (t) => ({ ...(data as Task), _rev: t._rev }))
      return true
    },
    [tasks, endOf, load],
  )

  const moveTask = useCallback(
    (id: string, status: Status, position: number) => updateTask(id, { status, position }),
    [updateTask],
  )

  const deleteTask = useCallback(
    async (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id))
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) {
        setActionError("Couldn't delete that task, so the board was refreshed.")
        void load()
        return false
      }
      return true
    },
    [load],
  )

  const toggleAssignee = useCallback(
    async (taskId: string, memberId: string) => {
      const task = tasks.find((t) => t.id === taskId)
      if (!task) return
      const on = task.task_assignees.some((a) => a.member_id === memberId)

      patchLocal(taskId, (t) => ({
        ...t,
        task_assignees: on
          ? t.task_assignees.filter((a) => a.member_id !== memberId)
          : [...t.task_assignees, { member_id: memberId }],
      }))

      const { error } = on
        ? await supabase.from('task_assignees').delete().match({ task_id: taskId, member_id: memberId })
        : await supabase.from('task_assignees').insert({ task_id: taskId, member_id: memberId })

      if (error) {
        setActionError("Couldn't update assignees, so the board was refreshed.")
        void load()
      } else {
        patchLocal(taskId, (t) => ({ ...t, _rev: (t._rev ?? 0) + 1 }))
      }
    },
    [tasks, load],
  )

  const toggleLabel = useCallback(
    async (taskId: string, labelId: string) => {
      const task = tasks.find((t) => t.id === taskId)
      if (!task) return
      const on = task.task_labels.some((l) => l.label_id === labelId)

      patchLocal(taskId, (t) => ({
        ...t,
        task_labels: on
          ? t.task_labels.filter((l) => l.label_id !== labelId)
          : [...t.task_labels, { label_id: labelId }],
      }))

      const { error } = on
        ? await supabase.from('task_labels').delete().match({ task_id: taskId, label_id: labelId })
        : await supabase.from('task_labels').insert({ task_id: taskId, label_id: labelId })

      if (error) {
        setActionError("Couldn't update labels, so the board was refreshed.")
        void load()
      } else {
        patchLocal(taskId, (t) => ({ ...t, _rev: (t._rev ?? 0) + 1 }))
      }
    },
    [tasks, load],
  )

  // after a member/label is deleted, the db cascade removes its links. mirror that locally.
  const forgetMember = useCallback((memberId: string) => {
    setTasks((prev) => prev.map((t) => ({ ...t, task_assignees: t.task_assignees.filter((a) => a.member_id !== memberId) })))
  }, [])
  const forgetLabel = useCallback((labelId: string) => {
    setTasks((prev) => prev.map((t) => ({ ...t, task_labels: t.task_labels.filter((l) => l.label_id !== labelId) })))
  }, [])

  return {
    tasks,
    loading,
    error,
    actionError,
    showError: setActionError,
    clearActionError: () => setActionError(null),
    reload: load,
    createTask,
    updateTask,
    moveTask,
    deleteTask,
    toggleAssignee,
    toggleLabel,
    forgetMember,
    forgetLabel,
  }
}

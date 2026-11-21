import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Priority, Status, Task } from '../types'

export interface NewTask {
  title: string
  status: Status
  description?: string | null
  priority?: Priority
  due_date?: string | null
}

export type TaskPatch = Partial<
  Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'due_date' | 'position'>
>

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
      .select('*')
      .order('position', { ascending: true })
    if (error) setError(error.message)
    else setTasks((data ?? []) as Task[])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (ready) void load()
  }, [ready, load])

  // position for a task added to the bottom of a column
  const endOf = useCallback(
    (status: Status) => {
      const inColumn = tasks.filter((t) => t.status === status)
      return inColumn.length ? Math.max(...inColumn.map((t) => t.position)) + GAP : GAP
    },
    [tasks],
  )

  const createTask = useCallback(
    async (input: NewTask) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...input, position: endOf(input.status) })
        .select()
        .single()

      if (error) {
        setActionError(`Couldn't create task: ${error.message}`)
        return false
      }
      setTasks((prev) => [...prev, data as Task])
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

      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))

      const { data, error } = await supabase
        .from('tasks')
        .update(patch)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        setActionError("Couldn't save that change, so the board was refreshed.")
        void load()
        return false
      }
      // swap in the saved row (fresh updated_at tells the detail panel to refresh activity)
      setTasks((prev) => prev.map((t) => (t.id === id ? (data as Task) : t)))
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

  return {
    tasks,
    loading,
    error,
    actionError,
    clearActionError: () => setActionError(null),
    reload: load,
    createTask,
    updateTask,
    moveTask,
    deleteTask,
  }
}

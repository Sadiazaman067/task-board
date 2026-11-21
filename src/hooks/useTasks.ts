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

  const createTask = useCallback(
    async (input: NewTask) => {
      const inColumn = tasks.filter((t) => t.status === input.status)
      const position = inColumn.length
        ? Math.max(...inColumn.map((t) => t.position)) + GAP
        : GAP

      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...input, position })
        .select()
        .single()

      if (error) {
        setActionError(`Couldn't create task: ${error.message}`)
        return false
      }
      setTasks((prev) => [...prev, data as Task])
      return true
    },
    [tasks],
  )

  // optimistic: update the UI instantly, then save. if saving fails, reload.
  const moveTask = useCallback(
    async (id: string, status: Status, position: number) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status, position } : t)),
      )
      const { error } = await supabase
        .from('tasks')
        .update({ status, position })
        .eq('id', id)
      if (error) {
        setActionError("Couldn't save that move, so the board was refreshed.")
        void load()
      }
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
    moveTask,
  }
}

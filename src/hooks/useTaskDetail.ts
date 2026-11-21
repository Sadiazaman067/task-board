import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Activity, Comment } from '../types'

interface Detail {
  taskId: string
  comments: Comment[]
  activity: Activity[]
}

// loads comments + activity for one task.
// `version` (the task's updated_at) changes after every edit, which re-fetches the activity log.
export function useTaskDetail(taskId: string, version: string) {
  const [data, setData] = useState<Detail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([
      supabase.from('comments').select('*').eq('task_id', taskId).order('created_at'),
      supabase
        .from('task_activity')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false }),
    ]).then(([c, a]) => {
      if (!active) return
      const err = c.error ?? a.error
      if (err) return setError(err.message)
      setError(null)
      setData({ taskId, comments: c.data as Comment[], activity: a.data as Activity[] })
    })
    return () => {
      active = false
    }
  }, [taskId, version])

  const addComment = useCallback(
    async (body: string) => {
      const { data: row, error } = await supabase
        .from('comments')
        .insert({ task_id: taskId, body })
        .select()
        .single()
      if (error) {
        setError(error.message)
        return false
      }
      setData((d) => (d ? { ...d, comments: [...d.comments, row as Comment] } : d))
      return true
    },
    [taskId],
  )

  const ready = data?.taskId === taskId
  return {
    loading: !ready && !error,
    error,
    comments: ready ? data.comments : [],
    activity: ready ? data.activity : [],
    addComment,
  }
}

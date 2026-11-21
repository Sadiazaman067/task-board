import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Label, Member } from '../types'

// team members + labels for the current guest
export function useWorkspace(ready: boolean) {
  const [members, setMembers] = useState<Member[]>([])
  const [labels, setLabels] = useState<Label[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ready) return
    let active = true
    Promise.all([
      supabase.from('team_members').select('*').order('created_at'),
      supabase.from('labels').select('*').order('created_at'),
    ]).then(([m, l]) => {
      if (!active) return
      const err = m.error ?? l.error
      if (err) return setError(err.message)
      setMembers(m.data as Member[])
      setLabels(l.data as Label[])
    })
    return () => {
      active = false
    }
  }, [ready])

  // these return an error message, or null on success
  const addMember = useCallback(async (name: string, color: string) => {
    const { data, error } = await supabase.from('team_members').insert({ name, color }).select().single()
    if (error) return error.message
    setMembers((prev) => [...prev, data as Member])
    return null
  }, [])

  const removeMember = useCallback(async (id: string) => {
    const { error } = await supabase.from('team_members').delete().eq('id', id)
    if (error) return error.message
    setMembers((prev) => prev.filter((m) => m.id !== id))
    return null
  }, [])

  const addLabel = useCallback(async (name: string, color: string) => {
    const { data, error } = await supabase.from('labels').insert({ name, color }).select().single()
    if (error) return error.code === '23505' ? 'You already have a label with that name' : error.message
    setLabels((prev) => [...prev, data as Label])
    return null
  }, [])

  const removeLabel = useCallback(async (id: string) => {
    const { error } = await supabase.from('labels').delete().eq('id', id)
    if (error) return error.message
    setLabels((prev) => prev.filter((l) => l.id !== id))
    return null
  }, [])

  return { members, labels, error, addMember, removeMember, addLabel, removeLabel }
}

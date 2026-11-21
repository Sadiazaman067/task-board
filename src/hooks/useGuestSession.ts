import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

// one shared promise so React StrictMode's double-run doesn't create two guests
let sessionPromise: Promise<Session> | null = null

function ensureGuestSession(): Promise<Session> {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) return data.session

      const { data: anon, error } = await supabase.auth.signInAnonymously()
      if (error || !anon.session) {
        throw new Error(error?.message ?? 'Could not start a guest session')
      }
      return anon.session
    })()
    // if it fails, allow a retry later
    sessionPromise.catch(() => {
      sessionPromise = null
    })
  }
  return sessionPromise
}

export function useGuestSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    ensureGuestSession()
      .then((s) => {
        if (active) {
          setSession(s)
          setError(null)
        }
      })
      .catch((e: Error) => {
        if (active) setError(e.message)
      })
    return () => {
      active = false
    }
  }, [attempt])

  return { session, error, retry: () => setAttempt((a) => a + 1) }
}

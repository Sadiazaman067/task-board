import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

export default function App() {
  const [msg, setMsg] = useState('signing in...')

  useEffect(() => {
    (async () => {
      let { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        const { data, error } = await supabase.auth.signInAnonymously()
        if (error) return setMsg('auth error: ' + error.message)
        session = data.session
      }
      const { data: task, error } = await supabase
        .from('tasks')
        .insert({ title: 'hello from the board 👋' })
        .select()
        .single()
      if (error) return setMsg('db error: ' + error.message)
      setMsg(`guest ${session!.user.id.slice(0, 8)} created task: ${task.title}`)
    })()
  }, [])

  return <div className="p-10 text-lg font-medium">{msg}</div>
}
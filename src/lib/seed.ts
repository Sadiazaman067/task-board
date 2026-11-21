import { addDays, format } from 'date-fns'
import { supabase } from './supabase'
import type { Priority, Status } from '../types'

const day = (offset: number) => format(addDays(new Date(), offset), 'yyyy-MM-dd')

// a realistic sample project so a first-time visitor sees every feature in action
export async function seedSampleBoard(): Promise<string | null> {
  const { data: members, error: mErr } = await supabase
    .from('team_members')
    .insert([
      { name: 'Maya Patel', color: '#6366f1' },
      { name: 'Leo Kim', color: '#10b981' },
      { name: 'Ana Souza', color: '#f59e0b' },
    ])
    .select()
  if (mErr || !members) return mErr?.message ?? 'Could not create team'

  // upsert so it doesn't fail if you already made a "Bug" label yourself
  const { data: labels, error: lErr } = await supabase
    .from('labels')
    .upsert(
      [
        { name: 'Bug', color: '#ef4444' },
        { name: 'Feature', color: '#6366f1' },
        { name: 'Design', color: '#ec4899' },
      ],
      { onConflict: 'user_id,name' },
    )
    .select()
  if (lErr || !labels) return lErr?.message ?? 'Could not create labels'

  const M = (name: string) => members.find((m) => m.name.startsWith(name))!.id as string
  const L = (name: string) => labels.find((l) => l.name === name)!.id as string

  const sample: {
    title: string; status: Status; priority: Priority; due: number | null
    description?: string; who: string[]; tags: string[]
  }[] = [
    { title: 'Login button unresponsive on Safari', status: 'todo', priority: 'high', due: 2, who: ['Ana'], tags: ['Bug'],
      description: 'Repro: Safari 17, click "Log in" twice quickly. Nothing happens.' },
    { title: 'Draft launch announcement', status: 'todo', priority: 'normal', due: 7, who: ['Maya'], tags: [] },
    { title: 'Explore dark mode color tokens', status: 'todo', priority: 'low', due: null, who: ['Ana'], tags: ['Design'] },
    { title: 'Fix mobile nav overlapping logo', status: 'in_progress', priority: 'high', due: -1, who: ['Leo'], tags: ['Bug'] },
    { title: 'Write API docs for tasks endpoint', status: 'in_progress', priority: 'low', due: 5, who: ['Maya'], tags: ['Feature'],
      description: 'Cover list, create, update and the status values.' },
    { title: 'Add drag-and-drop to board', status: 'in_review', priority: 'high', due: 0, who: ['Leo', 'Maya'], tags: ['Feature'] },
    { title: 'Design new pricing page', status: 'in_review', priority: 'normal', due: 1, who: ['Ana'], tags: ['Design', 'Feature'] },
    { title: 'Set up Supabase auth + RLS', status: 'done', priority: 'high', due: -2, who: ['Leo'], tags: ['Feature'] },
    { title: 'Audit current onboarding flow', status: 'done', priority: 'normal', due: -4, who: ['Maya'], tags: ['Design'] },
  ]

  const counters: Record<string, number> = {}
  const { data: tasks, error: tErr } = await supabase
    .from('tasks')
    .insert(
      sample.map((s) => {
        counters[s.status] = (counters[s.status] ?? 0) + 1000
        return {
          title: s.title, status: s.status, priority: s.priority,
          due_date: s.due === null ? null : day(s.due),
          description: s.description ?? null,
          position: counters[s.status],
        }
      }),
    )
    .select('id, title')
  if (tErr || !tasks) return tErr?.message ?? 'Could not create tasks'

  const idOf = (title: string) => tasks.find((t) => t.title === title)!.id as string
  const [a, l] = await Promise.all([
    supabase.from('task_assignees').insert(
      sample.flatMap((s) => s.who.map((w) => ({ task_id: idOf(s.title), member_id: M(w) }))),
    ),
    supabase.from('task_labels').insert(
      sample.flatMap((s) => s.tags.map((t) => ({ task_id: idOf(s.title), label_id: L(t) }))),
    ),
  ])
  return a.error?.message ?? l.error?.message ?? null
}

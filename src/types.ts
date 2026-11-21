export type Status = 'todo' | 'in_progress' | 'in_review' | 'done'
export type Priority = 'low' | 'normal' | 'high'

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  status: Status
  priority: Priority
  due_date: string | null
  position: number
  created_at: string
  updated_at: string
  // joined from the link tables (see TASK_SELECT in useTasks)
  task_assignees: { member_id: string }[]
  task_labels: { label_id: string }[]
  // local-only counter, bumped after assignee/label changes so the activity log refreshes
  _rev?: number
}

export interface Member {
  id: string
  name: string
  color: string
  created_at: string
}

export interface Label {
  id: string
  name: string
  color: string
  created_at: string
}

export interface Comment {
  id: string
  task_id: string
  body: string
  created_at: string
}

export interface Activity {
  id: string
  task_id: string
  action: string
  from_value: string | null
  to_value: string | null
  created_at: string
}

export interface ColumnDef {
  id: Status
  title: string
  dot: string
}

export const COLUMNS: ColumnDef[] = [
  { id: 'todo', title: 'To Do', dot: 'bg-slate-400' },
  { id: 'in_progress', title: 'In Progress', dot: 'bg-blue-500' },
  { id: 'in_review', title: 'In Review', dot: 'bg-amber-500' },
  { id: 'done', title: 'Done', dot: 'bg-emerald-500' },
]

export const PRIORITIES: Priority[] = ['low', 'normal', 'high']

export const SWATCHES = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#64748b']

export const isStatus = (id: unknown): id is Status =>
  COLUMNS.some((c) => c.id === id)

export const statusTitle = (s: string) =>
  COLUMNS.find((c) => c.id === s)?.title ?? s

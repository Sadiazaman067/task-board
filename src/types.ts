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

export const isStatus = (id: unknown): id is Status =>
  COLUMNS.some((c) => c.id === id)

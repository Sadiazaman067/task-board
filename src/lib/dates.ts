import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { Task } from '../types'

export const isOverdue = (t: Task) =>
  t.status !== 'done' && !!t.due_date && differenceInCalendarDays(parseISO(t.due_date), new Date()) < 0

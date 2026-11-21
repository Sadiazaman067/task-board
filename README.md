# Task Board

A polished, Kanban-style task board inspired by Linear and Asana. Built with **React + TypeScript + Vite + Tailwind CSS**, backed by **Supabase** (Postgres, anonymous auth, Row Level Security).

**Live demo:** _add your Vercel URL here_

## Features

- **Kanban board** with To Do / In Progress / In Review / Done, plus smooth drag & drop ([dnd-kit](https://dndkit.com)) with mouse, touch (long-press), and keyboard support
- **Guest accounts**: a private anonymous session is created automatically on first visit. RLS ensures each guest only ever sees their own data
- **Tasks**: title, description, priority, due date, created from a modal (press `N`) or inline in any column
- **Task detail panel**: edit everything, delete, **comments**, and an **activity timeline** written by database triggers
- **Team members & assignees** with colored avatar initials
- **Labels** (multiple per task) shown as chips on cards
- **Search** (press `/`) and **filters** by priority, assignee, and label
- **Due date indicators**: overdue (red), due today/soon (amber)
- **Board stats**: total, done, overdue, plus a progress bar
- **Dark mode** (remembers your choice, follows the OS by default)
- **Responsive** layout (columns swipe horizontally on mobile)
- Loading skeletons, friendly empty states, a sample project loader, and error toasts with automatic recovery

## Tech decisions

| Decision | Why |
|---|---|
| Call Supabase directly from the frontend | Less to deploy and maintain. Security is enforced in the database by RLS, not by an API layer |
| `user_id default auth.uid()` on every table | The client never sends a user id, so it can't be spoofed |
| Fractional `position` ordering | A drop sets position to the midpoint of its neighbours, so a move updates **one row** instead of renumbering a column |
| Optimistic updates | The UI moves instantly; on failure it shows a toast and reloads from the server |
| Activity log via Postgres triggers | Every status/title/priority/due/assignee/label change is logged server-side; the app can't forget to (or fake it) |
| Nested select `*, task_assignees(member_id), task_labels(label_id)` | Loads tasks with their relations in a single request |
| Dark mode via remapped CSS color tokens | Tailwind v4 colors are CSS variables, so dark mode is one block of CSS instead of `dark:` on every element |

## Run locally

**Prerequisites:** Node 20+ and a free [Supabase](https://supabase.com) project.

1. **Database**: in the Supabase dashboard
   - Authentication → Sign In / Providers → enable **Allow anonymous sign-ins**
   - SQL Editor → run `supabase/schema.sql`, then `supabase/phase6_activity_triggers.sql`
2. **Env vars**: create `.env.local` in the project root:
   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
   ```
   Only the public anon/publishable key is used. Never put the service role key in the frontend.
3. **Install & start**
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:5173

## Project structure

```
src/
  components/   Board, Column, TaskCard, NewTaskModal, TaskDetailPanel, Toolbar, WorkspaceModal, ...
  hooks/        useGuestSession, useTasks, useWorkspace, useTaskDetail, useTheme
  lib/          supabase client, sample-project seeder, lookup context, date helpers
  types.ts      shared types + column definitions
supabase/       SQL schema, RLS policies, triggers
```

## Keyboard shortcuts

| Key | Action |
|---|---|
| `N` | New task |
| `/` | Focus search |
| `Esc` | Close modal / panel, clear search |

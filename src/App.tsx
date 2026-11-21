import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, LayoutGrid, Moon, Plus, RefreshCw, SearchX, Sun, Users, X } from 'lucide-react'
import { AvatarStack } from './components/Avatar'
import { Board } from './components/Board'
import { NewTaskModal } from './components/NewTaskModal'
import { TaskDetailPanel } from './components/TaskDetailPanel'
import { EMPTY_FILTERS, Toolbar, hasFilters } from './components/Toolbar'
import type { Filters } from './components/Toolbar'
import { WelcomeCard } from './components/WelcomeCard'
import { WorkspaceModal } from './components/WorkspaceModal'
import { useGuestSession } from './hooks/useGuestSession'
import { useTheme } from './hooks/useTheme'
import { useTasks } from './hooks/useTasks'
import { useWorkspace } from './hooks/useWorkspace'
import { isOverdue } from './lib/dates'
import { LookupContext } from './lib/lookup'
import { seedSampleBoard } from './lib/seed'
import { COLUMNS } from './types'
import type { Status } from './types'

export default function App() {
  const { session, error: authError, retry } = useGuestSession()
  const t = useTasks(session !== null)
  const ws = useWorkspace(session !== null)
  const { theme, toggle: toggleTheme } = useTheme()

  const [newTaskStatus, setNewTaskStatus] = useState<Status | null>(null) // null = modal closed
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)

  const selectedTask = t.tasks.find((x) => x.id === selectedId) ?? null
  const fatal = authError ?? t.error ?? ws.error

  const lookup = useMemo(
    () => ({
      members: new Map(ws.members.map((m) => [m.id, m])),
      labels: new Map(ws.labels.map((l) => [l.id, l])),
    }),
    [ws.members, ws.labels],
  )

  const stats = useMemo(
    () => ({
      total: t.tasks.length,
      done: t.tasks.filter((x) => x.status === 'done').length,
      overdue: t.tasks.filter(isOverdue).length,
    }),
    [t.tasks],
  )

  // search + filters. within one filter = OR (High or Low); across filters = AND.
  const visibleTasks = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    return t.tasks.filter(
      (x) =>
        (!q || x.title.toLowerCase().includes(q)) &&
        (!filters.priorities.length || filters.priorities.includes(x.priority)) &&
        (!filters.members.length || x.task_assignees.some((a) => filters.members.includes(a.member_id))) &&
        (!filters.labels.length || x.task_labels.some((l) => filters.labels.includes(l.label_id))),
    )
  }, [t.tasks, filters])

  // keyboard shortcut: press "N" anywhere (when not typing) to create a task
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
      if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        setNewTaskStatus('todo')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // auto-hide error toasts after 5s
  const { actionError, clearActionError } = t
  useEffect(() => {
    if (!actionError) return
    const timer = setTimeout(clearActionError, 5000)
    return () => clearTimeout(timer)
  }, [actionError, clearActionError])

  // deleting a member/label also removes its links on every task
  const removeMember = async (id: string) => {
    const err = await ws.removeMember(id)
    if (!err) t.forgetMember(id)
    return err
  }
  const removeLabel = async (id: string) => {
    const err = await ws.removeLabel(id)
    if (!err) t.forgetLabel(id)
    return err
  }

  const loading = t.loading

  async function loadSample() {
    const err = await seedSampleBoard()
    if (err) t.showError(`Couldn't load the sample project: ${err}`)
    await Promise.all([t.reload(), ws.reload()])
  }

  return (
    <LookupContext.Provider value={lookup}>
      <div className="min-h-screen">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-[#fff]">
              <LayoutGrid size={16} />
            </div>
            <div>
              <h1 className="text-sm font-semibold">Task Board</h1>
              <p className="text-xs text-slate-500">
                {session ? `Guest · ${session.user.id.slice(0, 8)}` : 'Starting session…'}
              </p>
            </div>

            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <button
                onClick={toggleTheme}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                onClick={() => setWorkspaceOpen(true)}
                disabled={!!fatal || loading}
                className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                title="Team & labels"
              >
                {ws.members.length > 0 ? (
                  <AvatarStack members={ws.members} max={4} size={26} />
                ) : (
                  <>
                    <Users size={15} /> <span className="hidden sm:inline">Team</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setNewTaskStatus('todo')}
                disabled={!!fatal || loading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-[#fff] shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
              >
                <Plus size={15} /> <span className="hidden sm:inline">New task</span>
                <kbd className="ml-1 hidden rounded bg-indigo-500 px-1 text-[10px] font-medium sm:inline">N</kbd>
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
          {fatal ? (
            <ErrorState message={fatal} onRetry={authError ? retry : () => window.location.reload()} />
          ) : loading ? (
            <BoardSkeleton />
          ) : (
            <>
              {t.tasks.length === 0 ? (
                <WelcomeCard onCreate={() => setNewTaskStatus('todo')} onSeed={loadSample} />
              ) : (
                <Toolbar
                  filters={filters}
                  onChange={setFilters}
                  members={ws.members}
                  labels={ws.labels}
                  stats={stats}
                  shown={visibleTasks.length}
                />
              )}
              {hasFilters(filters) && visibleTasks.length === 0 && (
                <div className="mb-5 flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
                  <SearchX size={16} className="text-slate-400" />
                  No tasks match these filters.
                  <button onClick={() => setFilters(EMPTY_FILTERS)} className="font-medium text-indigo-600 hover:underline">
                    Clear filters
                  </button>
                </div>
              )}
              <Board
                tasks={visibleTasks}
                onMove={t.moveTask}
                onCreate={(status, title) => t.createTask({ status, title })}
                onOpen={setSelectedId}
                onAddClick={setNewTaskStatus}
              />
            </>
          )}
        </main>

        {newTaskStatus && (
          <NewTaskModal
            initialStatus={newTaskStatus}
            onClose={() => setNewTaskStatus(null)}
            onCreate={t.createTask}
            members={ws.members}
            labels={ws.labels}
            onManage={() => setWorkspaceOpen(true)}
          />
        )}

        {selectedTask && (
          <TaskDetailPanel
            key={selectedTask.id}
            task={selectedTask}
            onClose={() => setSelectedId(null)}
            onUpdate={t.updateTask}
            onDelete={t.deleteTask}
            onToggleAssignee={t.toggleAssignee}
            onToggleLabel={t.toggleLabel}
            members={ws.members}
            labels={ws.labels}
            onManage={() => setWorkspaceOpen(true)}
          />
        )}

        {workspaceOpen && (
          <WorkspaceModal
            members={ws.members}
            labels={ws.labels}
            onClose={() => setWorkspaceOpen(false)}
            addMember={ws.addMember}
            removeMember={removeMember}
            addLabel={ws.addLabel}
            removeLabel={removeLabel}
          />
        )}

        {actionError && (
          <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg animate-pop-in">
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
            {actionError}
            <button onClick={clearActionError} className="text-slate-400 hover:text-white" aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </LookupContext.Provider>
  )
}

function BoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden" aria-label="Loading board">
      {COLUMNS.map((c) => (
        <div key={c.id} className="w-72 shrink-0 rounded-2xl bg-slate-100/80 p-3 lg:flex-1">
          <div className="mb-4 h-4 w-24 animate-pulse rounded bg-slate-200" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="mb-2 h-20 animate-pulse rounded-xl bg-white ring-1 ring-slate-200" />
          ))}
        </div>
      ))}
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mx-auto mt-20 max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-rose-600">
        <AlertCircle size={22} />
      </div>
      <h2 className="font-semibold">Something went wrong</h2>
      <p className="mt-1 text-sm text-slate-500">{message}</p>
      <button
        onClick={onRetry}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        <RefreshCw size={14} /> Try again
      </button>
    </div>
  )
}

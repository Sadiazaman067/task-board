import { AlertCircle, LayoutGrid, RefreshCw, X } from 'lucide-react'
import { Board } from './components/Board'
import { useGuestSession } from './hooks/useGuestSession'
import { useTasks } from './hooks/useTasks'
import { COLUMNS } from './types'

export default function App() {
  const { session, error: authError, retry } = useGuestSession()
  const { tasks, loading, error, actionError, clearActionError, reload, createTask, moveTask } =
    useTasks(session !== null)

  const fatal = authError ?? error
  const doneCount = tasks.filter((t) => t.status === 'done').length

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">
            <LayoutGrid size={16} />
          </div>
          <div>
            <h1 className="text-sm font-semibold">Task Board</h1>
            <p className="text-xs text-slate-500">
              {session ? `Guest · ${session.user.id.slice(0, 8)}` : 'Starting session…'}
            </p>
          </div>
          {!loading && !fatal && (
            <p className="ml-auto text-xs text-slate-500">
              <span className="font-semibold text-slate-800">{doneCount}</span> of {tasks.length} done
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
        {fatal ? (
          <ErrorState message={fatal} onRetry={authError ? retry : () => void reload()} />
        ) : loading ? (
          <BoardSkeleton />
        ) : (
          <Board
            tasks={tasks}
            onMove={moveTask}
            onCreate={(status, title) => createTask({ status, title })}
          />
        )}
      </main>

      {actionError && (
        <div className="fixed bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
          <AlertCircle size={16} className="text-rose-400" />
          {actionError}
          <button onClick={clearActionError} className="text-slate-400 hover:text-white" aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
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

import { useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'

interface Props {
  onCreate: () => void
  onSeed: () => Promise<void>
}

// shown when the board is completely empty (first visit)
export function WelcomeCard({ onCreate, onSeed }: Props) {
  const [seeding, setSeeding] = useState(false)

  return (
    <div className="mb-6 flex flex-col items-center gap-6 rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200 animate-pop-in sm:flex-row sm:text-left">
      {/* little illustration: a mini board */}
      <div className="flex shrink-0 gap-1.5 rounded-xl bg-slate-100 p-3" aria-hidden>
        {['bg-slate-400', 'bg-blue-500', 'bg-amber-500', 'bg-emerald-500'].map((dot, i) => (
          <div key={dot} className="w-10 space-y-1.5">
            <div className={`mx-auto h-1.5 w-1.5 rounded-full ${dot}`} />
            {Array.from({ length: 3 - (i % 3) }).map((_, j) => (
              <div key={j} className="h-5 rounded bg-white shadow-sm ring-1 ring-slate-200" />
            ))}
          </div>
        ))}
      </div>

      <div className="flex-1">
        <h2 className="text-lg font-semibold">Welcome to your board 👋</h2>
        <p className="mt-1 text-sm text-slate-500">
          You're signed in as a private guest, so only this browser can see your tasks.
          Start from scratch, or load a sample project to see everything in action.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-[#fff] shadow-sm transition hover:bg-indigo-500"
          >
            <Plus size={15} /> Create your first task
          </button>
          <button
            onClick={async () => {
              setSeeding(true)
              await onSeed()
              setSeeding(false)
            }}
            disabled={seeding}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <Sparkles size={15} className="text-indigo-500" />
            {seeding ? 'Loading sample…' : 'Load sample project'}
          </button>
        </div>
      </div>
    </div>
  )
}

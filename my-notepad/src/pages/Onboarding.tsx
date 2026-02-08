import { Link } from 'react-router-dom';
import { ArrowLeft, CheckSquare } from 'lucide-react';

export default function Onboarding() {
  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-50">
      <nav className="border-b border-zinc-800/80 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-300 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            <span>Back</span>
          </Link>
        </div>
      </nav>
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-50 mb-3">
          Getting started
        </h1>
        <p className="text-zinc-400 mb-10">
          Quick steps to start using Noted—express ideas, create todos, order by priority, mark done.
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-zinc-50 mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 text-sm font-bold">
                1
              </span>
              Open the app
            </h2>
            <p className="text-zinc-400 ml-10 mb-3">
              Open Noted in your browser or on your phone. You'll see <strong className="text-zinc-300">Tasks</strong> (your priority list) and <strong className="text-zinc-300">Notes</strong> (where you express ideas).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-50 mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 text-sm font-bold">
                2
              </span>
              Add your first task
            </h2>
            <div className="ml-10 space-y-3 text-zinc-400">
              <p>Go to the <strong className="text-zinc-300">Tasks</strong> tab and add a task. Set its priority so the list stays ordered by importance.</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Choose a priority (high, medium, low)—the list sorts by it</li>
                <li>Add a category if needed</li>
                <li>Tap the circle to mark it done as you go</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-50 mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 text-sm font-bold">
                3
              </span>
              Write your first note
            </h2>
            <p className="text-zinc-400 ml-10 mb-3">
              Open the <strong className="text-zinc-300">Notes</strong> tab to express ideas. You can turn a note into tasks; they appear in your priority list. Notes save automatically and sync when connected.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-50 mb-4 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-amber-500/80" aria-hidden />
              That's it
            </h2>
            <p className="text-zinc-400 ml-10 mb-6">
              You're ready. Express ideas in notes, create todos, order by priority, and mark them done as you go—like a kanban in list form.
            </p>
            <Link
              to="/app"
              className="ml-10 inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-semibold text-sm hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950 transition-colors"
            >
              Open app
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}

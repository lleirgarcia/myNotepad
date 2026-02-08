import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="h-dvh min-h-0 flex flex-col bg-zinc-950 text-zinc-50 overflow-hidden">
      <header className="shrink-0 px-4 sm:px-6 py-4 border-b border-zinc-800/80">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="text-zinc-400 hover:text-zinc-200 text-sm font-medium transition-colors"
          >
            ← Noted
          </Link>
        </div>
      </header>
      <main className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-8 max-w-2xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-zinc-50 mb-6">Privacy & Data</h1>
        <p className="text-sm text-zinc-400 mb-4">Last updated: 2026</p>
        <div className="prose prose-invert prose-sm max-w-none text-zinc-300 space-y-4">
          <p>
            This page describes how Noted treats your data. We aim to keep your notes and tasks
            under your control.
          </p>
          <h2 className="text-lg font-semibold text-zinc-50 mt-6">Data we collect</h2>
          <p>
            When you sign in with Google we receive your email and name from Google. We store a
            user id and your notes, tasks, and whiteboard content to provide the service.
          </p>
          <h2 className="text-lg font-semibold text-zinc-50 mt-6">How we use it</h2>
          <p>
            Your data is used only to run the app: to show and sync your notes and tasks, and to
            improve the product. We do not sell your data to third parties.
          </p>
          <h2 className="text-lg font-semibold text-zinc-50 mt-6">Where it is stored</h2>
          <p>
            Data may be stored on our backend and in Supabase (or similar infrastructure). We
            use industry-standard practices to keep it secure.
          </p>
          <h2 className="text-lg font-semibold text-zinc-50 mt-6">Your rights</h2>
          <p>
            You can request access, correction, or deletion of your data. To do so, contact us
            (e.g. via the link in the footer).
          </p>
          <h2 className="text-lg font-semibold text-zinc-50 mt-6">Cookies and local storage</h2>
          <p>
            We may use local storage to keep your session and preferences. This stays on your
            device unless you clear it.
          </p>
          <p className="mt-8">
            <Link to="/" className="text-amber-500 hover:text-amber-400 underline underline-offset-2">
              Back to home
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

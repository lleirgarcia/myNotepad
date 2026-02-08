import { Link } from 'react-router-dom';

export default function Terms() {
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
        <h1 className="text-2xl font-bold text-zinc-50 mb-6">Terms of Service</h1>
        <p className="text-sm text-zinc-400 mb-4">Last updated: 2026</p>
        <div className="prose prose-invert prose-sm max-w-none text-zinc-300 space-y-4">
          <p>
            By using Noted you agree to these terms. Noted is a productivity app for notes and tasks.
          </p>
          <h2 className="text-lg font-semibold text-zinc-50 mt-6">Use of the service</h2>
          <p>
            You may use Noted for personal or professional purposes. You are responsible for the
            content you store and for keeping your account secure.
          </p>
          <h2 className="text-lg font-semibold text-zinc-50 mt-6">Acceptable use</h2>
          <p>
            Do not use Noted for illegal purposes or to store content that infringes others’ rights.
            We may suspend or terminate access if we detect abuse.
          </p>
          <h2 className="text-lg font-semibold text-zinc-50 mt-6">Changes</h2>
          <p>
            We may update these terms. Continued use after changes means you accept the new terms.
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

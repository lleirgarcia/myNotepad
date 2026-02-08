import { Link } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';

export default function Pricing() {
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
          Pricing
        </h1>
        <p className="text-zinc-400 mb-10">
          Noted is free. Always.
        </p>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="text-4xl sm:text-5xl font-bold text-zinc-50 mb-2">Free</div>
            <p className="text-zinc-400">Forever</p>
          </div>

          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" aria-hidden />
              <span className="text-zinc-300">Unlimited ideas, notes, and priority list</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" aria-hidden />
              <span className="text-zinc-300">Order by priority, mark tasks done</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" aria-hidden />
              <span className="text-zinc-300">Web, iOS, and Android</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" aria-hidden />
              <span className="text-zinc-300">Cloud sync (when connected)</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" aria-hidden />
              <span className="text-zinc-300">Voice input on mobile</span>
            </li>
          </ul>

          <Link
            to="/app"
            className="block w-full text-center min-h-[48px] px-6 py-3 rounded-xl bg-amber-500 text-zinc-950 font-semibold text-base hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950 transition-colors"
          >
            Get started
          </Link>
        </div>
      </main>
    </div>
  );
}

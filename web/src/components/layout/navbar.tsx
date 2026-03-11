import { Sparkles, Search, LineChart } from "lucide-react";
import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-emerald-400 to-sky-500 text-black shadow-lg shadow-emerald-500/40">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-100">
            MarketChatter
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-xs font-medium text-zinc-400 sm:flex">
          <button className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1 text-xs text-zinc-300 shadow-sm shadow-black/40 transition hover:border-emerald-500/70 hover:bg-zinc-900">
            <Search className="h-3 w-3" />
            <span>Quick search</span>
            <kbd className="ml-2 hidden rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400 sm:inline">
              /
            </kbd>
          </button>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 rounded-full border border-zinc-800/80 bg-zinc-950/60 px-3 py-1 text-xs text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-100"
          >
            <LineChart className="h-3 w-3" />
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}


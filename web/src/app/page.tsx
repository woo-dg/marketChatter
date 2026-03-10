import { Navbar } from "@/components/layout/navbar";
import { QueryProvider } from "@/components/providers/query-provider";
import { FeaturedMarketsGrid } from "@/components/markets/featured-markets-grid";
import { prisma } from "@/lib/db";
import { Skeleton } from "@/components/ui/skeleton";
import { MarketSearchBar } from "@/components/search/market-search-bar";

export default async function Home() {
  // Ensure DB connectivity early for SSR; fall back gracefully if it fails.
  let hasMarkets = true;
  try {
    const count = await prisma.market.count();
    hasMarkets = count > 0;
  } catch {
    hasMarkets = false;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <section className="mt-2 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400/80">
              Prediction signal terminal
            </p>
            <h1 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
              The sharpest{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-sky-400 to-emerald-300 bg-clip-text text-transparent">
                market moves
              </span>{" "}
              and X chatter in one place.
            </h1>
            <p className="max-w-2xl text-sm text-zinc-400">
              MarketChatter watches Kalshi and Polymarket while continuously
              listening to curated X accounts, surfacing only the highest-signal
              posts for each market.
            </p>
          </div>
          <QueryProvider>
            <MarketSearchBar />
          </QueryProvider>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Viral now
            </h2>
            <p className="text-[11px] text-zinc-500">
              Live probabilities from Kalshi &amp; Polymarket
            </p>
          </div>
          <QueryProvider>
            {hasMarkets ? (
              <FeaturedMarketsGrid />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-2xl border border-zinc-800/80" />
                ))}
              </div>
            )}
          </QueryProvider>
        </section>

        <p className="mt-6 text-[10px] text-zinc-500">
          Signals are informational only and may be incomplete, biased, or
          wrong. Always do your own research.
        </p>
      </main>
    </div>
  );
}


"use client";

import { useQuery } from "@tanstack/react-query";
import { MarketCard } from "./market-card";
import { Skeleton } from "@/components/ui/skeleton";
import { MarketSpotlightOverlay } from "./market-spotlight-overlay";

type FeaturedMarket = {
  id: string;
  title: string;
  subtitle?: string | null;
  provider: string;
  category?: { id: string; name: string; slug: string } | null;
  yesProbability: number;
  noProbability: number;
  signalsCount: number;
  endDate: string | null;
};

async function fetchFeatured(): Promise<FeaturedMarket[]> {
  const res = await fetch("/api/markets/featured", { next: { revalidate: 5 } });
  if (!res.ok) throw new Error("Failed to load markets");
  return res.json();
}

export function FeaturedMarketsGrid() {
  const { data, isLoading } = useQuery({
    queryKey: ["featured-markets"],
    queryFn: fetchFeatured,
    refetchInterval: 15_000,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-40 rounded-2xl border border-zinc-800/80"
          />
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-10 text-center text-sm text-zinc-400">
        No active markets yet. Once ingestion jobs run, featured markets will
        appear here.
      </div>
    );
  }

  return (
    <MarketSpotlightOverlay>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((m) => (
          <MarketCard key={m.id} market={m} />
        ))}
      </div>
    </MarketSpotlightOverlay>
  );
}


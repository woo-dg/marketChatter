"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MarketCard } from "./market-card";
import { CategoryBar } from "./category-bar";
import { Skeleton } from "@/components/ui/skeleton";

type MarketItem = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  provider: string;
  category?: { id: string; name: string; slug: string } | null;
  outcomesJson?: string | null;
  outcomePricesJson?: string | null;
  volume?: number | null;
  signalsCount: number;
  endDate: string | null;
  tags?: string[];
};

type MarketsResponse = {
  markets: MarketItem[];
  total: number;
  limit: number;
  offset: number;
};

async function fetchMarkets(category: string | null): Promise<MarketsResponse> {
  const params = new URLSearchParams({
    active: "true",
    limit: "18",
    order: "volume",
  });
  if (category) params.set("category", category);
  const res = await fetch(`/api/markets?${params}`);
  if (!res.ok) throw new Error("Failed to load markets");
  return res.json();
}

export function FeaturedMarketsGrid() {
  const [category, setCategory] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["markets", category],
    queryFn: () => fetchMarkets(category),
    refetchInterval: 30_000,
  });

  return (
    <div className="flex flex-col gap-3">
      <CategoryBar selected={category} onSelect={setCategory} />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl border border-zinc-800/80" />
          ))}
        </div>
      ) : !data?.markets?.length ? (
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-10 text-center text-sm text-zinc-400">
          No active markets found. Run a sync to ingest Polymarket data.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.markets.map((m) => (
              <MarketCard key={m.id} market={m} />
            ))}
          </div>
          {data.total > data.markets.length && (
            <p className="text-center text-[11px] text-zinc-500">
              Showing {data.markets.length} of {data.total} markets
            </p>
          )}
        </>
      )}
    </div>
  );
}

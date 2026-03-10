"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2 } from "lucide-react";
import { MarketCard } from "@/components/markets/market-card";
import { useMarketSpotlight } from "@/components/markets/market-spotlight-overlay";

async function searchMarkets(q: string) {
  const res = await fetch(`/api/search/markets?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

export function MarketSearchBar() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { open: openSpotlight } = useMarketSpotlight();

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["search-markets", query],
    queryFn: () => searchMarkets(query),
    enabled: false,
  });

  useEffect(() => {
    if (!query) return;
    const id = setTimeout(() => {
      refetch();
      setOpen(true);
    }, 180);
    return () => clearTimeout(id);
  }, [query, refetch]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/") {
        e.preventDefault();
        const el = document.getElementById("market-search-input");
        el?.focus();
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(input.trim());
  };

  return (
    <div className="relative">
      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/80 px-3 py-1.5 text-xs text-zinc-300 shadow-sm shadow-black/40"
      >
        <Search className="h-3.5 w-3.5 text-zinc-500" />
        <input
          id="market-search-input"
          className="h-6 w-full bg-transparent text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
          placeholder="Search markets, categories, or tickers…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <kbd className="hidden rounded bg-zinc-900 px-1.5 py-0.5 text-[9px] text-zinc-500 sm:inline">
          /
        </kbd>
      </form>

      {open && query && (
        <div className="absolute z-30 mt-2 w-full rounded-2xl border border-zinc-800/80 bg-zinc-950/95 p-3 shadow-2xl shadow-black/70">
          {isFetching && (
            <div className="flex items-center gap-2 text-[11px] text-zinc-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              Searching…
            </div>
          )}
          {!isFetching && (!data || data.length === 0) && (
            <div className="text-[11px] text-zinc-500">
              No markets found for “{query}”.
            </div>
          )}
          {!isFetching && data?.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] text-zinc-500">
                {data.length} result{data.length === 1 ? "" : "s"}
              </p>
              <div className="grid gap-2">
                {data.slice(0, 4).map((m: any) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      openSpotlight(m.id);
                      setOpen(false);
                    }}
                    className="text-left"
                  >
                    <MarketCard market={m} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


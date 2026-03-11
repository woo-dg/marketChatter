"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2 } from "lucide-react";
import { useMarketSpotlight } from "@/components/markets/market-spotlight-overlay";

async function searchMarkets(q: string) {
  const res = await fetch(`/api/search/markets?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

export function MarketSearchBar() {
  const [input, setInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { open: openSpotlight } = useMarketSpotlight();
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce input -> debouncedQuery
  useEffect(() => {
    if (!input.trim()) {
      setDebouncedQuery("");
      setOpen(false);
      return;
    }
    const id = setTimeout(() => {
      setDebouncedQuery(input.trim());
      setOpen(true);
    }, 300);
    return () => clearTimeout(id);
  }, [input]);

  const { data, isFetching } = useQuery({
    queryKey: ["search-markets", debouncedQuery],
    queryFn: () => searchMarkets(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        document.getElementById("market-search-input")?.focus();
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            setDebouncedQuery(input.trim());
            setOpen(true);
          }
        }}
        className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/80 px-3 py-1.5 text-xs text-zinc-300 shadow-sm shadow-black/40"
      >
        <Search className="h-3.5 w-3.5 text-zinc-500" />
        <input
          id="market-search-input"
          className="h-6 w-full bg-transparent text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
          placeholder="Search markets, categories, or tickers…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => {
            if (debouncedQuery && data?.length) setOpen(true);
          }}
        />
        <kbd className="hidden rounded bg-zinc-900 px-1.5 py-0.5 text-[9px] text-zinc-500 sm:inline">
          /
        </kbd>
      </form>

      {open && debouncedQuery && (
        <div className="absolute z-30 mt-2 w-full rounded-2xl border border-zinc-800/80 bg-zinc-950/95 p-3 shadow-2xl shadow-black/70">
          {isFetching && (
            <div className="flex items-center gap-2 text-[11px] text-zinc-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              Searching…
            </div>
          )}
          {!isFetching && (!data || data.length === 0) && (
            <div className="text-[11px] text-zinc-500">
              No markets found for &ldquo;{debouncedQuery}&rdquo;.
            </div>
          )}
          {!isFetching && data?.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] text-zinc-500">
                {data.length} result{data.length === 1 ? "" : "s"}
              </p>
              <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
                {data.slice(0, 6).map((m: any) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      openSpotlight(m.id);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between rounded-lg border border-zinc-800/60 bg-zinc-950/60 px-3 py-2 text-left transition hover:border-emerald-500/50 hover:bg-zinc-900/60"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="line-clamp-1 text-[12px] font-medium text-zinc-100">
                        {m.title}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                        {m.category && <span>{m.category.name}</span>}
                        {m.volume != null && m.volume > 0 && (
                          <span>
                            ${m.volume >= 1_000_000
                              ? `${(m.volume / 1_000_000).toFixed(1)}M`
                              : m.volume >= 1_000
                                ? `${(m.volume / 1_000).toFixed(0)}K`
                                : m.volume.toFixed(0)} vol
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="ml-2 shrink-0 text-[10px] text-zinc-500">
                      {m.active ? "Live" : "Closed"}
                    </span>
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

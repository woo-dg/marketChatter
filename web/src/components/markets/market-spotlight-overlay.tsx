"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ProbabilitySplit } from "./probability-split";
import { PostCarousel } from "@/components/posts/post-carousel";

type SpotlightContextValue = { open: (marketId: string) => void };
const SpotlightContext = createContext<SpotlightContextValue | null>(null);

export function useMarketSpotlight() {
  const ctx = useContext(SpotlightContext);
  if (!ctx) throw new Error("useMarketSpotlight must be used within MarketSpotlightOverlay");
  return ctx;
}

export function MarketSpotlightOverlay({ children }: { children: React.ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const open = useCallback((id: string) => setActiveId(id), []);
  const close = useCallback(() => setActiveId(null), []);

  return (
    <SpotlightContext.Provider value={{ open }}>
      <div className="relative">
        {children}
        <AnimatePresence>
          {activeId && <SpotlightModal key={activeId} marketId={activeId} onClose={close} />}
        </AnimatePresence>
      </div>
    </SpotlightContext.Provider>
  );
}

// ----- Modal -----

type MarketDetail = {
  market: {
    id: string;
    slug: string;
    title: string;
    subtitle?: string | null;
    description?: string | null;
    url?: string | null;
    rulesUrl?: string | null;
    provider: string;
    status: string;
    endDate: string | null;
    outcomesJson?: string | null;
    outcomePricesJson?: string | null;
    volume?: number | null;
    liquidity?: number | null;
    category?: { id: string; name: string; slug: string } | null;
    tags?: string[];
  };
  matches: any[];
};

async function fetchMarket(id: string): Promise<MarketDetail | null> {
  const res = await fetch(`/api/markets/${id}`);
  if (!res.ok) return null;
  return res.json();
}

function parseProbabilities(m: MarketDetail["market"]) {
  if (!m.outcomePricesJson) return { yes: 0.5, no: 0.5 };
  try {
    const prices: string[] = JSON.parse(m.outcomePricesJson);
    const outcomes: string[] = m.outcomesJson ? JSON.parse(m.outcomesJson) : [];
    const yesIdx = outcomes.findIndex((o) => o.toLowerCase() === "yes");
    if (yesIdx >= 0 && prices[yesIdx]) {
      const y = parseFloat(prices[yesIdx]);
      return { yes: y, no: yesIdx === 0 && prices[1] ? parseFloat(prices[1]) : 1 - y };
    }
    if (prices.length >= 2) return { yes: parseFloat(prices[0]), no: parseFloat(prices[1]) };
  } catch { /* fallback */ }
  return { yes: 0.5, no: 0.5 };
}

function formatVolume(v: number | null | undefined): string | null {
  if (!v) return null;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function SpotlightModal({ marketId, onClose }: { marketId: string; onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ["market", marketId],
    queryFn: () => fetchMarket(marketId),
  });

  const market = data?.market;
  const probs = market ? parseProbabilities(market) : null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-2xl" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 8 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="relative z-10 flex h-[70vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-zinc-800/80 bg-gradient-to-br from-zinc-950 via-zinc-950/95 to-zinc-950/90 shadow-[0_0_90px_rgba(0,0,0,0.9)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-5 py-3">
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">Market spotlight</p>
            {market ? (
              <h2 className="text-sm font-semibold text-zinc-50">{market.title}</h2>
            ) : (
              <div className="h-4 w-40 animate-pulse rounded bg-zinc-800/60" />
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 text-zinc-400 shadow-sm transition hover:border-zinc-600 hover:text-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-0 overflow-y-auto p-5 lg:flex-row lg:gap-4">
          {/* Left: market detail */}
          <div className="flex min-w-0 flex-1 flex-col gap-3 border-b border-zinc-900/60 pb-4 pr-0 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4">
            {market ? (
              <>
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                    <span className="rounded-full border border-zinc-800 bg-zinc-950/80 px-2 py-0.5 text-[10px]">
                      {market.provider === "POLYMARKET" ? "Polymarket" : market.provider}
                    </span>
                    {market.category && (
                      <span className="rounded-full border border-zinc-800 bg-zinc-950/80 px-2 py-0.5 text-[10px] text-zinc-400">
                        {market.category.name}
                      </span>
                    )}
                    <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                      {market.status === "OPEN" ? "Live" : market.status}
                    </span>
                    {formatVolume(market.volume) && (
                      <span className="text-[10px] text-zinc-500">
                        Vol: {formatVolume(market.volume)}
                      </span>
                    )}
                    {formatVolume(market.liquidity) && (
                      <span className="text-[10px] text-zinc-500">
                        Liq: {formatVolume(market.liquidity)}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold leading-6 text-zinc-50">{market.title}</h3>
                  {market.subtitle && market.subtitle !== market.title && (
                    <p className="text-[11px] text-zinc-400">{market.subtitle}</p>
                  )}
                </div>

                {probs && (
                  <div className="mt-1">
                    <ProbabilitySplit yes={probs.yes} no={probs.no} />
                  </div>
                )}

                {market.description && (
                  <p className="mt-1 line-clamp-4 text-[11px] leading-relaxed text-zinc-400">
                    {market.description}
                  </p>
                )}

                {/* Tags */}
                {market.tags && market.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {market.tags.map((t) => (
                      <span key={t} className="rounded-full border border-zinc-800 bg-zinc-950/80 px-2 py-0.5 text-[10px] text-zinc-500">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-500">
                  {market.url && (
                    <a
                      href={market.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-zinc-800 bg-zinc-950/80 px-2.5 py-0.5 text-[10px] text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
                    >
                      View on Polymarket
                    </a>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="h-4 w-32 animate-pulse rounded bg-zinc-800/60" />
                <div className="h-6 w-2/3 animate-pulse rounded bg-zinc-800/60" />
                <div className="h-10 w-full animate-pulse rounded-xl bg-zinc-900/80" />
              </div>
            )}
          </div>

          {/* Right: X signals (future narrative layer) */}
          <div className="mt-4 flex min-h-0 flex-1 flex-col rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-3 lg:mt-0">
            <div className="mb-2 flex items-center justify-between text-[11px] text-zinc-400">
              <span className="uppercase tracking-[0.18em] text-zinc-500">X signals</span>
            </div>
            <div className="flex-1">
              <PostCarousel matches={data?.matches ?? []} />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

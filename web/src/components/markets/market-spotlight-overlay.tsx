"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ProbabilitySplit } from "./probability-split";
import { PostCarousel } from "@/components/posts/post-carousel";

type SpotlightContextValue = {
  open: (marketId: string) => void;
};

const SpotlightContext = createContext<SpotlightContextValue | null>(null);

export function useMarketSpotlight() {
  const ctx = useContext(SpotlightContext);
  if (!ctx) {
    throw new Error("useMarketSpotlight must be used within MarketSpotlightOverlay");
  }
  return ctx;
}

type OverlayProps = {
  children: React.ReactNode;
};

export function MarketSpotlightOverlay({ children }: OverlayProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const open = useCallback((id: string) => setActiveId(id), []);
  const close = useCallback(() => setActiveId(null), []);

  return (
    <SpotlightContext.Provider value={{ open }}>
      <div className="relative">
        {children}
        <AnimatePresence>
          {activeId && (
            <SpotlightModal key={activeId} marketId={activeId} onClose={close} />
          )}
        </AnimatePresence>
      </div>
    </SpotlightContext.Provider>
  );
}

type SpotlightModalProps = {
  marketId: string;
  onClose: () => void;
};

type MarketWithPosts = {
  market: {
    id: string;
    title: string;
    subtitle?: string | null;
    description?: string | null;
    url?: string | null;
    rulesUrl?: string | null;
    provider: string;
    status: string;
    endDate: string | null;
    category?: { id: string; name: string; slug: string } | null;
  };
  latestSnapshot: {
    yesProbability: number;
    noProbability: number;
    fetchedAt: string;
  } | null;
  matches: any[];
};

async function fetchMarket(id: string): Promise<MarketWithPosts | null> {
  const res = await fetch(`/api/markets/${id}`);
  if (!res.ok) return null;
  return res.json();
}

function SpotlightModal({ marketId, onClose }: SpotlightModalProps) {
  const { data } = useQuery({
    queryKey: ["market", marketId],
    queryFn: () => fetchMarket(marketId),
  });

  const market = data?.market;
  const snapshot = data?.latestSnapshot;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-2xl"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 8 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="relative z-10 flex h-[70vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-zinc-800/80 bg-gradient-to-br from-zinc-950 via-zinc-950/95 to-zinc-950/90 shadow-[0_0_90px_rgba(0,0,0,0.9)]"
      >
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-5 py-3">
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
              Market spotlight
            </p>
            {market ? (
              <h2 className="text-sm font-semibold text-zinc-50">
                {market.title}
              </h2>
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

        <div className="flex flex-1 flex-col gap-0 p-5 lg:flex-row lg:gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-3 border-b border-zinc-900/60 pb-4 pr-0 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4">
            {market ? (
              <>
                <div className="flex flex-col gap-1">
                  <div className="inline-flex items-center gap-2 text-[11px] text-zinc-500">
                    <span className="rounded-full border border-zinc-800 bg-zinc-950/80 px-2 py-0.5 text-[10px]">
                      {market.provider === "KALSHI"
                        ? "Kalshi"
                        : market.provider === "POLYMARKET"
                          ? "Polymarket"
                          : market.provider}
                    </span>
                    {market.category && (
                      <span className="rounded-full border border-zinc-800 bg-zinc-950/80 px-2 py-0.5 text-[10px] text-zinc-400">
                        {market.category.name}
                      </span>
                    )}
                    {market.status && (
                      <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                        {market.status === "OPEN" ? "Live" : market.status}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold leading-6 text-zinc-50">
                    {market.title}
                  </h3>
                  {market.subtitle && (
                    <p className="text-[11px] text-zinc-400">{market.subtitle}</p>
                  )}
                </div>

                <div className="mt-1">
                  {snapshot ? (
                    <ProbabilitySplit
                      yes={snapshot.yesProbability}
                      no={snapshot.noProbability}
                    />
                  ) : (
                    <div className="h-10 animate-pulse rounded-xl bg-zinc-900/80" />
                  )}
                </div>

                {market.description && (
                  <p className="mt-1 line-clamp-4 text-[11px] leading-relaxed text-zinc-400">
                    {market.description}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-500">
                  {market.url && (
                    <a
                      href={market.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-zinc-800 bg-zinc-950/80 px-2.5 py-0.5 text-[10px] text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
                    >
                      View market
                    </a>
                  )}
                  {market.rulesUrl && (
                    <a
                      href={market.rulesUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-zinc-800 bg-zinc-950/80 px-2.5 py-0.5 text-[10px] text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
                    >
                      Rules &amp; resolution
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

          <div className="mt-4 flex min-h-0 flex-1 flex-col rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-3 lg:mt-0">
            <div className="mb-2 flex items-center justify-between text-[11px] text-zinc-400">
              <span className="uppercase tracking-[0.18em] text-zinc-500">
                X signals
              </span>
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


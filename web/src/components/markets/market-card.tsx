"use client";

import { motion } from "framer-motion";
import { BadgeCheck, SignalHigh } from "lucide-react";
import { ProbabilitySplit } from "./probability-split";
import { useMarketSpotlight } from "./market-spotlight-overlay";

type Props = {
  market: {
    id: string;
    slug?: string;
    title: string;
    subtitle?: string | null;
    provider: string;
    category?: { id: string; name: string; slug: string } | null;
    outcomesJson?: string | null;
    outcomePricesJson?: string | null;
    yesProbability?: number;
    noProbability?: number;
    volume?: number | null;
    signalsCount?: number;
    endDate: string | null;
    tags?: string[];
  };
};

const providerColors: Record<string, string> = {
  KALSHI: "from-emerald-400 to-emerald-500",
  POLYMARKET: "from-sky-400 to-sky-500",
};

function parsePrices(m: Props["market"]): { yes: number; no: number } {
  if (m.yesProbability != null && m.noProbability != null) {
    return { yes: m.yesProbability, no: m.noProbability };
  }
  if (!m.outcomePricesJson) return { yes: 0.5, no: 0.5 };
  try {
    const prices: string[] = JSON.parse(m.outcomePricesJson);
    const outcomes: string[] = m.outcomesJson ? JSON.parse(m.outcomesJson) : [];
    const yesIdx = outcomes.findIndex((o) => o.toLowerCase() === "yes");
    if (yesIdx >= 0 && prices[yesIdx]) {
      const y = parseFloat(prices[yesIdx]);
      return { yes: y, no: yesIdx === 0 && prices[1] ? parseFloat(prices[1]) : 1 - y };
    }
    if (prices.length >= 2) {
      return { yes: parseFloat(prices[0]), no: parseFloat(prices[1]) };
    }
  } catch { /* fallback */ }
  return { yes: 0.5, no: 0.5 };
}

function formatVolume(v: number | null | undefined): string | null {
  if (!v) return null;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

export function MarketCard({ market }: Props) {
  const { open } = useMarketSpotlight();
  const { yes, no } = parsePrices(market);

  const providerLabel =
    market.provider === "KALSHI"
      ? "Kalshi"
      : market.provider === "POLYMARKET"
        ? "Polymarket"
        : market.provider;

  const endLabel = market.endDate
    ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(market.endDate))
    : null;

  const vol = formatVolume(market.volume);

  return (
    <motion.button
      type="button"
      onClick={() => open(market.id)}
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className="group flex h-full flex-col rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-4 text-left shadow-[0_0_40px_rgba(0,0,0,0.7)] outline-none ring-emerald-400/60 ring-offset-0 transition hover:border-emerald-500/70 hover:bg-zinc-950/90 focus-visible:ring-1"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/70 px-2.5 py-1 text-[10px] text-zinc-400">
          <span
            className={`h-4 w-4 rounded-full bg-gradient-to-br ${providerColors[market.provider] ?? "from-zinc-500 to-zinc-700"} text-[9px] font-semibold text-black shadow-md`}
          >
            <span className="flex h-full items-center justify-center">
              {providerLabel[0]}
            </span>
          </span>
          <span>{providerLabel}</span>
          {market.category && (
            <>
              <span className="h-1 w-1 rounded-full bg-zinc-700" />
              <span className="text-[10px] text-zinc-500">{market.category.name}</span>
            </>
          )}
        </div>
        {vol && (
          <span className="text-[10px] text-zinc-500">{vol} vol</span>
        )}
      </div>

      <div className="mb-3 flex flex-1 flex-col gap-1">
        <p className="line-clamp-2 text-sm font-medium text-zinc-100">{market.title}</p>
        {market.subtitle && market.subtitle !== market.title && (
          <p className="line-clamp-1 text-[11px] text-zinc-500">{market.subtitle}</p>
        )}
      </div>

      <div className="mt-auto flex items-end justify-between gap-2">
        <ProbabilitySplit yes={yes} no={no} />
        <div className="flex flex-col items-end gap-1 text-[10px] text-zinc-500">
          {(market.signalsCount ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 text-emerald-400/80">
              <SignalHigh className="h-3 w-3" />
              {market.signalsCount} signals
            </span>
          )}
          {endLabel && (
            <span className="inline-flex items-center gap-1">
              <BadgeCheck className="h-3 w-3" />
              Ends {endLabel}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

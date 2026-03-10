"use client";

import { motion } from "framer-motion";
import { BadgeCheck, SignalHigh } from "lucide-react";
import { ProbabilitySplit } from "./probability-split";
import { useMarketSpotlight } from "./market-spotlight-overlay";

type Props = {
  market: {
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
};

const providerColors: Record<string, string> = {
  KALSHI: "from-emerald-400 to-emerald-500",
  POLYMARKET: "from-sky-400 to-sky-500",
};

export function MarketCard({ market }: Props) {
  const { open } = useMarketSpotlight();

  const providerLabel =
    market.provider === "KALSHI"
      ? "Kalshi"
      : market.provider === "POLYMARKET"
        ? "Polymarket"
        : market.provider;

  const endLabel = market.endDate
    ? new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
      }).format(new Date(market.endDate))
    : "TBD";

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
            className={`h-4 w-4 rounded-full bg-gradient-to-br ${providerColors[market.provider] ?? "from-zinc-500 to-zinc-700"} text-[9px] font-semibold text-black shadow-md shadow-emerald-500/30`}
          >
            <span className="flex h-full items-center justify-center">
              {providerLabel[0]}
            </span>
          </span>
          <span>{providerLabel}</span>
          {market.category && (
            <>
              <span className="h-1 w-1 rounded-full bg-zinc-700" />
              <span className="text-[10px] text-zinc-500">
                {market.category.name}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-emerald-400/80">
          <SignalHigh className="h-3 w-3" />
          <span>{market.signalsCount || 0} signals</span>
        </div>
      </div>

      <div className="mb-3 flex flex-1 flex-col gap-1">
        <p className="line-clamp-2 text-sm font-medium text-zinc-100">
          {market.title}
        </p>
        {market.subtitle && (
          <p className="line-clamp-1 text-[11px] text-zinc-500">
            {market.subtitle}
          </p>
        )}
      </div>

      <div className="mt-auto flex items-end justify-between gap-2">
        <ProbabilitySplit
          yes={market.yesProbability}
          no={market.noProbability}
        />
        <div className="flex flex-col items-end gap-1 text-[10px] text-zinc-500">
          <span className="inline-flex items-center gap-1">
            <BadgeCheck className="h-3 w-3 text-zinc-500" />
            <span>Ends {endLabel}</span>
          </span>
        </div>
      </div>
    </motion.button>
  );
}


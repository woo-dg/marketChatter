"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PostCard } from "./post-card";

type Match = {
  id: string;
  relevanceScore: number;
  stanceLabel?: string | null;
  stanceConfidence?: number | null;
  post: {
    id: string;
    text: string;
    url: string;
    postedAt: string;
    replyCount?: number | null;
    repostCount?: number | null;
    likeCount?: number | null;
    quoteCount?: number | null;
    sourceAccount: {
      displayName: string;
      handle: string;
      profileImageUrl?: string | null;
      verified: boolean;
      trustScore: number;
    };
  };
};

type Props = {
  matches: Match[];
};

export function PostCarousel({ matches }: Props) {
  const [index, setIndex] = useState(0);

  if (!matches.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 text-center text-[11px] text-zinc-500">
        <p>No high-signal posts yet.</p>
        <p className="mt-1 text-[10px] text-zinc-600">
          As curated accounts talk about this market, they will appear here.
        </p>
      </div>
    );
  }

  const safeIndex = Math.min(index, matches.length - 1);
  const current = matches[safeIndex];

  const go = (delta: number) => {
    setIndex((prev) => {
      const next = prev + delta;
      if (next < 0) return matches.length - 1;
      if (next >= matches.length) return 0;
      return next;
    });
  };

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between text-[10px] text-zinc-500">
        <span>
          Showing signal {safeIndex + 1} of {matches.length}
        </span>
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => go(-1)}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-50"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-50"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="absolute inset-0"
          >
            <PostCard
              post={current.post}
              stanceLabel={current.stanceLabel as any}
              stanceConfidence={current.stanceConfidence ?? undefined}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}


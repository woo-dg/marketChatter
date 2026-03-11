import { ArrowUpRight, Plus, Minus } from "lucide-react";
import type { StanceLabel } from "@/lib/constants";

type PostCardProps = {
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
  stanceLabel?: StanceLabel | null;
  stanceConfidence?: number | null;
};

const timeFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function PostCard({ post, stanceLabel, stanceConfidence }: PostCardProps) {
  const dateLabel = timeFormatter.format(new Date(post.postedAt));

  const stanceColor =
    stanceLabel === "YES"
      ? "text-emerald-400 bg-emerald-500/8 border-emerald-500/40"
      : stanceLabel === "NO"
        ? "text-rose-400 bg-rose-500/8 border-rose-500/40"
        : "text-zinc-400 bg-zinc-900/80 border-zinc-800";

  const StanceIcon =
    stanceLabel === "YES" ? Plus : stanceLabel === "NO" ? Minus : undefined;

  return (
    <article className="flex h-full flex-col justify-between rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-3 text-xs shadow-[0_0_40px_rgba(0,0,0,0.75)]">
      <header className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 overflow-hidden rounded-full bg-zinc-900">
            {post.sourceAccount.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.sourceAccount.profileImageUrl}
                alt={post.sourceAccount.displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-zinc-400">
                {post.sourceAccount.displayName[0]}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-zinc-100">
                {post.sourceAccount.displayName}
              </span>
              {post.sourceAccount.verified && (
                <span className="rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[9px] text-sky-300">
                  ✓
                </span>
              )}
            </div>
            <span className="text-[10px] text-zinc-500">
              @{post.sourceAccount.handle} · {dateLabel}
            </span>
          </div>
        </div>
        <div
          className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] ${stanceColor}`}
        >
          {StanceIcon && <StanceIcon className="h-3 w-3" />}
          <span className="uppercase tracking-[0.16em]">
            {stanceLabel ?? "NEUTRAL"}
          </span>
          {stanceConfidence && (
            <span className="text-[9px] text-zinc-400">
              {(stanceConfidence * 100).toFixed(0)}%
            </span>
          )}
        </div>
      </header>

      <p className="mb-3 line-clamp-5 whitespace-pre-wrap text-[11px] leading-relaxed text-zinc-200">
        {post.text}
      </p>

      <footer className="flex items-center justify-between text-[10px] text-zinc-500">
        <div className="flex items-center gap-3">
          {typeof post.likeCount === "number" && (
            <span>❤ {post.likeCount}</span>
          )}
          {typeof post.repostCount === "number" && (
            <span>↻ {post.repostCount}</span>
          )}
          {typeof post.replyCount === "number" && <span>💬 {post.replyCount}</span>}
        </div>
        <a
          href={post.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[10px] text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
        >
          Open on X
          <ArrowUpRight className="h-3 w-3" />
        </a>
      </footer>
    </article>
  );
}


import { cn } from "@/lib/utils";

type Props = {
  yes: number;
  no: number;
};

const fmt = (p: number) => `${Math.round(p * 100)}%`;

export function ProbabilitySplit({ yes, no }: Props) {
  return (
    <div className="flex flex-col gap-1 text-[11px]">
      <div className="flex items-center gap-2">
        <div className="flex h-4 items-center gap-1 text-emerald-400">
          <span className="flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] text-emerald-300">
            +
          </span>
          <span className="uppercase tracking-[0.16em] text-[9px] text-emerald-300/80">
            Yes
          </span>
        </div>
        <div className="flex h-4 items-center gap-1 text-rose-400">
          <span className="flex h-3 w-3 items-center justify-center rounded-full bg-rose-500/15 text-[10px] text-rose-300">
            -
          </span>
          <span className="uppercase tracking-[0.16em] text-[9px] text-rose-300/80">
            No
          </span>
        </div>
      </div>
      <div className="flex h-7 items-stretch rounded-full bg-zinc-900/90 p-0.5 text-[11px] shadow-inner shadow-black/80">
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-400/90 to-emerald-500/90 px-2 text-black",
          )}
          style={{ width: `${Math.max(16, yes * 100)}%` }}
        >
          <span className="font-semibold">{fmt(yes)}</span>
        </div>
        <div
          className="flex items-center justify-center rounded-full bg-gradient-to-r from-zinc-800/60 via-zinc-900/80 to-rose-500/80 px-2 text-[11px] text-zinc-100"
          style={{ width: `${Math.max(16, no * 100)}%` }}
        >
          <span className="font-semibold">{fmt(no)}</span>
        </div>
      </div>
    </div>
  );
}


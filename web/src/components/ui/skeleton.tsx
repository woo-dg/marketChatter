import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-zinc-800/60",
        "bg-[radial-gradient(circle_at_top,_#27272f,_#18181b_60%,_#09090b_100%)]",
        className,
      )}
      {...props}
    />
  );
}


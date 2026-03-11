"use client";

import { useQuery } from "@tanstack/react-query";

type Category = {
  id: string;
  slug: string;
  name: string;
  marketCount: number;
};

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch("/api/categories");
  if (!res.ok) return [];
  return res.json();
}

type Props = {
  selected: string | null;
  onSelect: (slug: string | null) => void;
};

export function CategoryBar({ selected, onSelect }: Props) {
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 60_000,
  });

  if (!categories?.length) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition ${
          !selected
            ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
            : "border-zinc-800 bg-zinc-950/70 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelect(cat.slug === selected ? null : cat.slug)}
          className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition ${
            selected === cat.slug
              ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
              : "border-zinc-800 bg-zinc-950/70 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
          }`}
        >
          {cat.name}
          <span className="ml-1.5 text-[9px] text-zinc-500">{cat.marketCount}</span>
        </button>
      ))}
    </div>
  );
}

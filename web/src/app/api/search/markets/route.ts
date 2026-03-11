import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const category = url.searchParams.get("category") || undefined;
  const limitParam = parseInt(url.searchParams.get("limit") || "20", 10);
  const limit = Math.min(Math.max(limitParam, 1), 50);

  if (!q) {
    return NextResponse.json({ error: "q parameter required" }, { status: 400 });
  }

  const where: any = {
    OR: [
      { title: { contains: q } },
      { description: { contains: q } },
      { slug: { contains: q } },
      { tags: { some: { label: { contains: q } } } },
    ],
  };

  if (category) {
    where.category = { slug: category };
  }

  const results = await prisma.market.findMany({
    where,
    orderBy: [{ active: "desc" }, { volume: "desc" }],
    take: limit,
    include: {
      category: true,
      tags: { select: { label: true } },
      matches: { where: { hidden: false }, select: { id: true } },
    },
  });

  return NextResponse.json(
    results.map((m) => ({
      id: m.id,
      slug: m.slug,
      title: m.title,
      subtitle: m.subtitle,
      provider: m.provider,
      active: m.active,
      category: m.category
        ? { id: m.category.id, name: m.category.name, slug: m.category.slug }
        : null,
      outcomesJson: m.outcomesJson,
      outcomePricesJson: m.outcomePricesJson,
      volume: m.volume,
      liquidity: m.liquidity,
      signalsCount: m.matches.length,
      endDate: m.endDate?.toISOString() ?? null,
      tags: m.tags.map((t) => t.label),
    })),
  );
}

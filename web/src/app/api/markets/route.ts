import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category") || undefined;
  const q = url.searchParams.get("q") || undefined;
  const activeParam = url.searchParams.get("active");
  const order = url.searchParams.get("order") || "volume";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);

  const active = activeParam === "false" ? false : true;

  const where: any = { active };

  if (category) {
    where.category = { slug: category };
  }
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { tags: { some: { label: { contains: q } } } },
    ];
  }

  const orderBy: any[] =
    order === "liquidity"
      ? [{ liquidity: "desc" }]
      : order === "endDate"
        ? [{ endDate: "asc" }]
        : [{ volume: "desc" }];

  const [markets, total] = await Promise.all([
    prisma.market.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit,
      include: {
        category: true,
        tags: { select: { label: true } },
        matches: { where: { hidden: false }, select: { id: true } },
      },
    }),
    prisma.market.count({ where }),
  ]);

  return NextResponse.json({
    markets: markets.map((m) => ({
      id: m.id,
      slug: m.slug,
      title: m.title,
      subtitle: m.subtitle,
      provider: m.provider,
      status: m.status,
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
    total,
    limit,
    offset,
  });
}

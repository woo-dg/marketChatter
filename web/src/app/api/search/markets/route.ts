import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { searchQuerySchema } from "@/lib/validation";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = searchQuerySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    category: url.searchParams.get("category") ?? undefined,
    provider: url.searchParams.get("provider") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const { q, category, provider, limit } = parsed.data;

  const results = await prisma.market.findMany({
    where: {
      active: true,
      AND: [
        {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { subtitle: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        category
          ? {
              category: {
                slug: category,
              },
            }
          : {},
        provider ? { provider: provider as any } : {},
      ],
    },
    take: limit,
    include: {
      category: true,
      snapshots: {
        orderBy: { fetchedAt: "desc" },
        take: 1,
      },
      matches: {
        where: { hidden: false },
        select: { id: true },
      },
    },
  });

  return NextResponse.json(
    results.map((m) => {
      const latest = m.snapshots[0];
      return {
        id: m.id,
        title: m.title,
        subtitle: m.subtitle,
        provider: m.provider,
        category: m.category
          ? { id: m.category.id, name: m.category.name, slug: m.category.slug }
          : null,
        yesProbability: latest?.yesProbability ?? 0.5,
        noProbability: latest?.noProbability ?? 0.5,
        signalsCount: m.matches.length,
        endDate: m.endDate ? m.endDate.toISOString() : null,
      };
    }),
  );
}


import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { markets: { where: { active: true } } } },
    },
  });

  return NextResponse.json(
    categories
      .map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description,
        icon: c.icon,
        marketCount: c._count.markets,
      }))
      .filter((c) => c.marketCount > 0)
      .sort((a, b) => b.marketCount - a.marketCount),
  );
}

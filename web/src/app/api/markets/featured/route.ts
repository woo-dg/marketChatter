import { NextResponse } from "next/server";
import { getFeaturedMarkets } from "@/services/marketIngestion";

export async function GET() {
  const markets = await getFeaturedMarkets(12);
  return NextResponse.json(
    markets.map((m) => ({
      ...m,
      endDate: m.endDate ? m.endDate.toISOString() : null,
      provider: m.provider,
      category: m.category
        ? { id: m.category.id, name: m.category.name, slug: m.category.slug }
        : null,
    })),
    { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30" } },
  );
}


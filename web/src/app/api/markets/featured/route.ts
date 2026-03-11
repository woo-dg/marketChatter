import { NextResponse } from "next/server";
import { getFeaturedMarkets } from "@/services/marketIngestion";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category") || undefined;
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "12", 10), 50);

  const markets = await getFeaturedMarkets(limit);

  const filtered = category
    ? markets.filter((m) => m.category?.slug === category)
    : markets;

  return NextResponse.json(
    filtered.map((m) => ({
      ...m,
      endDate: m.endDate ? m.endDate.toISOString() : null,
    })),
    { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30" } },
  );
}

import { NextResponse } from "next/server";
import { updateMarketPostMatchesForCategory } from "@/services/relevance";
import { classifyStanceForMatches } from "@/services/stance";

export async function POST() {
  await updateMarketPostMatchesForCategory();
  await classifyStanceForMatches();
  return NextResponse.json({ ok: true });
}


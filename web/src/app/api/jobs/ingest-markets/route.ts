import { NextResponse } from "next/server";
import { ingestTopMarkets } from "@/services/marketIngestion";

export async function POST() {
  await ingestTopMarkets();
  return NextResponse.json({ ok: true });
}


import { NextResponse } from "next/server";
import { syncAllPolymarkets } from "@/services/marketIngestion";

export async function POST() {
  try {
    await syncAllPolymarkets();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}

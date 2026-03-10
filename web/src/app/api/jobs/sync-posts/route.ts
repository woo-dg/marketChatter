import { NextResponse } from "next/server";
import { syncSourcesAndPosts } from "@/services/sourceSync";

export async function POST() {
  await syncSourcesAndPosts();
  return NextResponse.json({ ok: true });
}


import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Try by ID first, then by slug
  let market = await prisma.market.findUnique({
    where: { id },
    include: {
      category: true,
      tags: { select: { label: true } },
      snapshots: { orderBy: { fetchedAt: "desc" }, take: 1 },
      matches: {
        where: { hidden: false },
        orderBy: [
          { pinned: "desc" },
          { relevanceScore: "desc" },
          { createdAt: "desc" },
        ],
        include: { post: { include: { sourceAccount: true } } },
        take: 40,
      },
    },
  });

  if (!market) {
    market = await prisma.market.findUnique({
      where: { slug: id },
      include: {
        category: true,
        tags: { select: { label: true } },
        snapshots: { orderBy: { fetchedAt: "desc" }, take: 1 },
        matches: {
          where: { hidden: false },
          orderBy: [
            { pinned: "desc" },
            { relevanceScore: "desc" },
            { createdAt: "desc" },
          ],
          include: { post: { include: { sourceAccount: true } } },
          take: 40,
        },
      },
    });
  }

  if (!market) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    market: {
      id: market.id,
      slug: market.slug,
      title: market.title,
      subtitle: market.subtitle,
      description: market.description,
      url: market.url,
      rulesUrl: market.rulesUrl,
      provider: market.provider,
      providerEventSlug: market.providerEventSlug,
      status: market.status,
      active: market.active,
      endDate: market.endDate?.toISOString() ?? null,
      outcomesJson: market.outcomesJson,
      outcomePricesJson: market.outcomePricesJson,
      volume: market.volume,
      liquidity: market.liquidity,
      category: market.category
        ? { id: market.category.id, name: market.category.name, slug: market.category.slug }
        : null,
      tags: market.tags.map((t) => t.label),
    },
    matches: market.matches.map((m) => ({
      id: m.id,
      relevanceScore: m.relevanceScore,
      stanceLabel: m.stanceLabel,
      stanceConfidence: m.stanceConfidence,
      post: {
        id: m.post.id,
        text: m.post.text,
        url: m.post.url,
        postedAt: m.post.postedAt.toISOString(),
        replyCount: m.post.replyCount,
        repostCount: m.post.repostCount,
        likeCount: m.post.likeCount,
        quoteCount: m.post.quoteCount,
        sourceAccount: {
          displayName: m.post.sourceAccount.displayName,
          handle: m.post.sourceAccount.handle,
          profileImageUrl: m.post.sourceAccount.profileImageUrl,
          verified: m.post.sourceAccount.verified,
          trustScore: m.post.sourceAccount.trustScore,
        },
      },
    })),
  });
}

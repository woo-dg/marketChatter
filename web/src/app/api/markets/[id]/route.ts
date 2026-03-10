import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  const market = await prisma.market.findUnique({
    where: { id },
    include: {
      category: true,
      snapshots: {
        orderBy: { fetchedAt: "desc" },
        take: 50,
      },
      matches: {
        where: { hidden: false },
        orderBy: [
          { pinned: "desc" },
          { relevanceScore: "desc" },
          { createdAt: "desc" },
        ],
        include: {
          post: {
            include: { sourceAccount: true },
          },
        },
      },
    },
  });

  if (!market) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const latestSnapshot = market.snapshots[0]
    ? {
        yesProbability: market.snapshots[0].yesProbability,
        noProbability: market.snapshots[0].noProbability,
        fetchedAt: market.snapshots[0].fetchedAt.toISOString(),
      }
    : null;

  return NextResponse.json({
    market: {
      id: market.id,
      title: market.title,
      subtitle: market.subtitle,
      description: market.description,
      url: market.url,
      rulesUrl: market.rulesUrl,
      provider: market.provider,
      status: market.status,
      endDate: market.endDate ? market.endDate.toISOString() : null,
      category: market.category
        ? {
            id: market.category.id,
            name: market.category.name,
            slug: market.category.slug,
          }
        : null,
    },
    latestSnapshot,
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


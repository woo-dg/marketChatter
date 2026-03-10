import { prisma } from "@/lib/db";
import { logger } from "@/lib/logging";

// Extremely lightweight keyword-based relevance with room for LLM/embeddings.

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function keywordScore(marketText: string, postText: string): number {
  const mTokens = new Set(tokenize(marketText));
  const pTokens = tokenize(postText);
  if (!mTokens.size || !pTokens.length) return 0;

  let overlap = 0;
  for (const t of pTokens) {
    if (mTokens.has(t)) overlap += 1;
  }
  return overlap / Math.sqrt(mTokens.size * pTokens.length);
}

export async function updateMarketPostMatchesForCategory(categoryId?: string) {
  const markets = await prisma.market.findMany({
    where: {
      active: true,
      categoryId: categoryId ?? undefined,
    },
    include: {
      category: true,
    },
  });

  const posts = await prisma.post.findMany({
    where: {
      sourceAccount: {
        categories: categoryId ? { some: { categoryId } } : undefined,
      },
    },
    include: {
      sourceAccount: true,
    },
  });

  let created = 0;

  for (const market of markets) {
    const marketText = `${market.title} ${market.subtitle ?? ""} ${
      market.description ?? ""
    } ${market.category?.name ?? ""}`;

    for (const post of posts) {
      const score = keywordScore(marketText, post.text);
      if (score < 0.12) continue;

      await prisma.marketPostMatch.upsert({
        where: {
          marketId_postId: { marketId: market.id, postId: post.id },
        },
        update: {
          relevanceScore: score,
          relevanceMethod: "keyword_v1",
        },
        create: {
          marketId: market.id,
          postId: post.id,
          relevanceScore: score,
          relevanceMethod: "keyword_v1",
        },
      });

      created += 1;
    }
  }

  logger.info("Updated market-post matches", { created });
}


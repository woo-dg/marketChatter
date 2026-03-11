import { MarketStatus, Provider } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logging";
import { PolymarketProvider } from "@/providers/markets/polymarket";
import type { NormalizedMarket } from "@/providers/markets/types";

const polymarket = new PolymarketProvider();

// ---------------------------------------------------------------------------
// Full sync: categories + all active markets
// ---------------------------------------------------------------------------

export async function syncAllPolymarkets() {
  const job = await prisma.jobRun.create({
    data: { jobType: "polymarket.fullSync", status: "RUNNING" },
  });

  try {
    // 1. Sync tags -> categories
    const tags = await polymarket.fetchTags();
    for (const tag of tags) {
      await prisma.category.upsert({
        where: { tagId: tag.id },
        update: { name: tag.label, slug: tag.slug },
        create: {
          tagId: tag.id,
          slug: tag.slug,
          name: tag.label,
          active: true,
        },
      });
    }
    logger.info(`Synced ${tags.length} categories from Polymarket tags`);

    // 2. Fetch all active markets
    const markets = await polymarket.fetchAllActiveMarkets();
    logger.info(`Fetched ${markets.length} markets, persisting…`);

    const seenIds = new Set<string>();
    let upserted = 0;

    for (const m of markets) {
      await upsertMarket(m);
      seenIds.add(`${m.provider}:${m.providerMarketId}`);
      upserted++;
    }

    // 3. Mark unseen active Polymarket markets as inactive
    const staleMarkets = await prisma.market.findMany({
      where: { provider: Provider.POLYMARKET, active: true },
      select: { id: true, providerMarketId: true },
    });
    let deactivated = 0;
    for (const sm of staleMarkets) {
      if (!seenIds.has(`${Provider.POLYMARKET}:${sm.providerMarketId}`)) {
        await prisma.market.update({
          where: { id: sm.id },
          data: { active: false },
        });
        deactivated++;
      }
    }

    await prisma.jobRun.update({
      where: { id: job.id },
      data: {
        status: "SUCCESS",
        finishedAt: new Date(),
        metadata: JSON.stringify({ upserted, deactivated, tags: tags.length }),
      },
    });

    logger.info(`Sync complete: ${upserted} upserted, ${deactivated} deactivated`);
  } catch (error) {
    logger.error("Polymarket sync failed", { error });
    await prisma.jobRun.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        errorMessage: (error as Error).message,
      },
    });
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Upsert a single normalized market into the DB
// ---------------------------------------------------------------------------

async function upsertMarket(m: NormalizedMarket) {
  const slugBase = `${m.provider.toLowerCase()}-${m.providerMarketId}`
    .replace(/[^a-zA-Z0-9-]/g, "-")
    .toLowerCase()
    .slice(0, 200);

  // Resolve category
  let categoryId: string | null = null;
  if (m.categorySlug) {
    const cat = await prisma.category.findUnique({
      where: { slug: m.categorySlug },
    });
    if (cat) categoryId = cat.id;
  }

  const market = await prisma.market.upsert({
    where: {
      provider_providerMarketId: {
        provider: m.provider,
        providerMarketId: m.providerMarketId,
      },
    },
    update: {
      title: m.title,
      subtitle: m.subtitle,
      description: m.description,
      url: m.url,
      rulesUrl: m.rulesUrl,
      status: m.status,
      endDate: m.endDate,
      active: m.status === MarketStatus.OPEN,
      providerEventId: m.providerEventId,
      providerEventSlug: m.providerEventSlug,
      outcomesJson: m.outcomesJson,
      outcomePricesJson: m.outcomePricesJson,
      volume: m.volume ?? 0,
      liquidity: m.liquidity ?? 0,
      lastSyncedAt: new Date(),
      categoryId,
    },
    create: {
      provider: m.provider,
      providerMarketId: m.providerMarketId,
      providerEventId: m.providerEventId,
      providerEventSlug: m.providerEventSlug,
      slug: slugBase,
      title: m.title,
      subtitle: m.subtitle,
      description: m.description,
      url: m.url,
      rulesUrl: m.rulesUrl,
      status: m.status,
      endDate: m.endDate,
      active: m.status === MarketStatus.OPEN,
      outcomesJson: m.outcomesJson,
      outcomePricesJson: m.outcomePricesJson,
      volume: m.volume ?? 0,
      liquidity: m.liquidity ?? 0,
      lastSyncedAt: new Date(),
      categoryId,
    },
  });

  // Snapshot
  await prisma.marketSnapshot.create({
    data: {
      marketId: market.id,
      yesProbability: m.yesProbability,
      noProbability: m.noProbability,
      volume: m.volume,
      liquidity: m.liquidity,
    },
  });

  // Tags (upsert to avoid duplicates)
  if (m.tags?.length) {
    for (const label of m.tags) {
      await prisma.marketTag.upsert({
        where: { marketId_label: { marketId: market.id, label } },
        update: {},
        create: { marketId: market.id, label },
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Query helpers used by API routes
// ---------------------------------------------------------------------------

export async function getFeaturedMarkets(limit = 12) {
  const markets = await prisma.market.findMany({
    where: { active: true, status: MarketStatus.OPEN },
    orderBy: [{ volume: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: {
      category: true,
      tags: { select: { label: true } },
      matches: { where: { hidden: false }, select: { id: true } },
    },
  });

  return markets.map((m) => ({
    id: m.id,
    slug: m.slug,
    title: m.title,
    subtitle: m.subtitle,
    provider: m.provider,
    category: m.category
      ? { id: m.category.id, name: m.category.name, slug: m.category.slug }
      : null,
    yesProbability: 0.5,
    noProbability: 0.5,
    outcomesJson: m.outcomesJson,
    outcomePricesJson: m.outcomePricesJson,
    volume: m.volume,
    liquidity: m.liquidity,
    signalsCount: m.matches.length,
    endDate: m.endDate,
    tags: m.tags.map((t) => t.label),
    ...latestPrices(m),
  }));
}

function latestPrices(m: { outcomePricesJson?: string | null; outcomesJson?: string | null }) {
  if (!m.outcomePricesJson) return {};
  try {
    const prices: string[] = JSON.parse(m.outcomePricesJson);
    const outcomes: string[] = m.outcomesJson ? JSON.parse(m.outcomesJson) : [];
    const yesIdx = outcomes.findIndex((o) => o.toLowerCase() === "yes");
    if (yesIdx >= 0 && prices[yesIdx]) {
      return {
        yesProbability: parseFloat(prices[yesIdx]),
        noProbability: yesIdx === 0 && prices[1] ? parseFloat(prices[1]) : 1 - parseFloat(prices[yesIdx]),
      };
    }
    if (prices.length >= 2) {
      return {
        yesProbability: parseFloat(prices[0]),
        noProbability: parseFloat(prices[1]),
      };
    }
  } catch { /* fallback */ }
  return {};
}

export async function getMarketBySlug(slug: string) {
  return prisma.market.findUnique({
    where: { slug },
    include: {
      category: true,
      tags: { select: { label: true } },
      matches: {
        where: { hidden: false },
        orderBy: [{ pinned: "desc" }, { relevanceScore: "desc" }, { createdAt: "desc" }],
        include: { post: { include: { sourceAccount: true } } },
        take: 40,
      },
    },
  });
}

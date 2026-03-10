import { MarketStatus, Provider } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logging";
import type { MarketProvider } from "@/providers/markets/types";
import { MockMarketProvider } from "@/providers/markets/mock";

const providers: MarketProvider[] = [new MockMarketProvider()];

export async function ingestTopMarkets() {
  const job = await prisma.jobRun.create({
    data: {
      jobType: "market.ingestTop",
      status: "RUNNING",
      metadata: {},
    },
  });

  try {
    for (const provider of providers) {
      const markets = await provider.fetchTopMarkets({ limit: 100 });
      for (const m of markets) {
        const slugBase = `${m.provider.toLowerCase()}-${m.providerMarketId}`.replace(
          /[^a-zA-Z0-9-]/g,
          "-",
        );

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
          },
          create: {
            provider: m.provider,
            providerMarketId: m.providerMarketId,
            slug: slugBase.toLowerCase(),
            title: m.title,
            subtitle: m.subtitle,
            description: m.description,
            url: m.url,
            rulesUrl: m.rulesUrl,
            status: m.status,
            endDate: m.endDate,
            active: m.status === MarketStatus.OPEN,
          },
        });

        await prisma.marketSnapshot.create({
          data: {
            marketId: market.id,
            yesProbability: m.yesProbability,
            noProbability: m.noProbability,
            volume: m.volume ?? undefined,
            liquidity: m.liquidity ?? undefined,
          },
        });
      }
    }

    await prisma.jobRun.update({
      where: { id: job.id },
      data: { status: "SUCCESS", finishedAt: new Date() },
    });
  } catch (error) {
    logger.error("Market ingestion failed", { error });
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

export async function getFeaturedMarkets(limit = 8) {
  const markets = await prisma.market.findMany({
    where: { active: true, status: MarketStatus.OPEN },
    orderBy: [
      { createdAt: "desc" },
      // fallback ordering by snapshots volume if joined
    ],
    take: limit,
    include: {
      snapshots: {
        orderBy: { fetchedAt: "desc" },
        take: 1,
      },
      category: true,
      matches: {
        where: { hidden: false },
        select: { id: true },
      },
    },
  });

  return markets.map((m) => {
    const latest = m.snapshots[0];
    return {
      id: m.id,
      title: m.title,
      subtitle: m.subtitle,
      provider: m.provider,
      category: m.category,
      yesProbability: latest?.yesProbability ?? 0.5,
      noProbability: latest?.noProbability ?? 0.5,
      signalsCount: m.matches.length,
      endDate: m.endDate,
    };
  });
}

export async function getMarketWithPosts(marketId: string) {
  const market = await prisma.market.findUnique({
    where: { id: marketId },
    include: {
      snapshots: {
        orderBy: { fetchedAt: "desc" },
        take: 50,
      },
      category: true,
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
        take: 40,
      },
    },
  });

  if (!market) return null;

  const latest = market.snapshots[0];

  return {
    market,
    latestSnapshot: latest,
  };
}


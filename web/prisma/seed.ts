import { PrismaClient } from "@prisma/client";

const Provider = { KALSHI: "KALSHI", POLYMARKET: "POLYMARKET", X: "X" } as const;
const MarketStatus = { OPEN: "OPEN", RESOLVED: "RESOLVED", CANCELLED: "CANCELLED", PAUSED: "PAUSED" } as const;
const StanceLabel = { YES: "YES", NO: "NO", NEUTRAL: "NEUTRAL" } as const;

const prisma = new PrismaClient();

async function main() {
  // Categories
  const ai = await prisma.category.upsert({
    where: { slug: "ai-llms" },
    update: {},
    create: {
      slug: "ai-llms",
      name: "AI / LLMs",
      description: "Frontier models, evals, infra, and labs.",
      icon: "cpu",
    },
  });

  const elections = await prisma.category.upsert({
    where: { slug: "elections-us" },
    update: {},
    create: {
      slug: "elections-us",
      name: "US Elections",
      description: "Polling, swing states, and campaign events.",
      icon: "ballot",
    },
  });

  const crypto = await prisma.category.upsert({
    where: { slug: "crypto" },
    update: {},
    create: {
      slug: "crypto",
      name: "Crypto / BTC",
      description: "Bitcoin, ETFs, macro flows.",
      icon: "bitcoin",
    },
  });

  // Source accounts
  const aiSource = await prisma.sourceAccount.upsert({
    where: {
      provider_providerUserId: {
        provider: Provider.X,
        providerUserId: "ai_researcher_1",
      },
    },
    update: {},
    create: {
      provider: Provider.X,
      providerUserId: "ai_researcher_1",
      handle: "ai_researcher_1",
      displayName: "Frontier Eval Researcher",
      verified: true,
      trustScore: 0.9,
      priorityWeight: 1.3,
      profileImageUrl: null,
    },
  });

  const electionsSource = await prisma.sourceAccount.upsert({
    where: {
      provider_providerUserId: {
        provider: Provider.X,
        providerUserId: "elections_watcher",
      },
    },
    update: {},
    create: {
      provider: Provider.X,
      providerUserId: "elections_watcher",
      handle: "elections_watcher",
      displayName: "Elections Watcher",
      verified: true,
      trustScore: 0.85,
      priorityWeight: 1.2,
      profileImageUrl: null,
    },
  });

  const cryptoSource = await prisma.sourceAccount.upsert({
    where: {
      provider_providerUserId: {
        provider: Provider.X,
        providerUserId: "crypto_macro_guy",
      },
    },
    update: {},
    create: {
      provider: Provider.X,
      providerUserId: "crypto_macro_guy",
      handle: "crypto_macro_guy",
      displayName: "Crypto Macro Guy",
      verified: false,
      trustScore: 0.8,
      priorityWeight: 1.1,
      profileImageUrl: null,
    },
  });

  // Category-source joins
  await prisma.categorySourceAccount.upsert({
    where: {
      categoryId_sourceAccountId: {
        categoryId: ai.id,
        sourceAccountId: aiSource.id,
      },
    },
    update: {},
    create: {
      categoryId: ai.id,
      sourceAccountId: aiSource.id,
    },
  });

  await prisma.categorySourceAccount.upsert({
    where: {
      categoryId_sourceAccountId: {
        categoryId: elections.id,
        sourceAccountId: electionsSource.id,
      },
    },
    update: {},
    create: {
      categoryId: elections.id,
      sourceAccountId: electionsSource.id,
    },
  });

  await prisma.categorySourceAccount.upsert({
    where: {
      categoryId_sourceAccountId: {
        categoryId: crypto.id,
        sourceAccountId: cryptoSource.id,
      },
    },
    update: {},
    create: {
      categoryId: crypto.id,
      sourceAccountId: cryptoSource.id,
    },
  });

  // Markets + snapshots (align with mock provider IDs)
  const aiMarket = await prisma.market.upsert({
    where: {
      provider_providerMarketId: {
        provider: Provider.KALSHI,
        providerMarketId: "kalshi_ai_models_2025",
      },
    },
    update: {},
    create: {
      provider: Provider.KALSHI,
      providerMarketId: "kalshi_ai_models_2025",
      slug: "kalshi-ai-models-2025",
      title:
        "Will OpenAI's next flagship model outperform Claude on MMLU by Dec 2025?",
      subtitle: "Flagship LLM benchmarks",
      description:
        "Benchmark race between frontier labs on MMLU and reasoning-heavy evals.",
      url: "https://kalshi.com/markets/ai-model-benchmark-2025",
      rulesUrl: "https://kalshi.com/markets/ai-model-benchmark-2025/rules",
      status: MarketStatus.OPEN,
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      active: true,
      categoryId: ai.id,
    },
  });

  const electionMarket = await prisma.market.upsert({
    where: {
      provider_providerMarketId: {
        provider: Provider.POLYMARKET,
        providerMarketId: "poly_usa_pres_2028",
      },
    },
    update: {},
    create: {
      provider: Provider.POLYMARKET,
      providerMarketId: "poly_usa_pres_2028",
      slug: "poly-usa-pres-2028",
      title: "Will the Democratic candidate win the 2028 U.S. presidential election?",
      subtitle: "US Elections",
      description:
        "Outcome of the 2028 United States presidential election popular vote.",
      url: "https://polymarket.com/event/us-presidential-2028",
      rulesUrl: "https://polymarket.com/event/us-presidential-2028/description",
      status: MarketStatus.OPEN,
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 3),
      active: true,
      categoryId: elections.id,
    },
  });

  const btcMarket = await prisma.market.upsert({
    where: {
      provider_providerMarketId: {
        provider: Provider.POLYMARKET,
        providerMarketId: "poly_btc_100k_2026",
      },
    },
    update: {},
    create: {
      provider: Provider.POLYMARKET,
      providerMarketId: "poly_btc_100k_2026",
      slug: "poly-btc-100k-2026",
      title: "Will BTC trade above $100k at any point in 2026?",
      subtitle: "Crypto macro",
      description:
        "High-beta macro and ETF flows driving BTC price action during 2026.",
      url: "https://polymarket.com/event/btc-100k-2026",
      rulesUrl: "https://polymarket.com/event/btc-100k-2026/description",
      status: MarketStatus.OPEN,
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
      active: true,
      categoryId: crypto.id,
    },
  });

  await prisma.marketSnapshot.create({
    data: {
      marketId: aiMarket.id,
      yesProbability: 0.62,
      noProbability: 0.38,
      volume: 120000,
      liquidity: 50000,
    },
  });
  await prisma.marketSnapshot.create({
    data: {
      marketId: electionMarket.id,
      yesProbability: 0.55,
      noProbability: 0.45,
      volume: 850000,
      liquidity: 210000,
    },
  });
  await prisma.marketSnapshot.create({
    data: {
      marketId: btcMarket.id,
      yesProbability: 0.48,
      noProbability: 0.52,
      volume: 430000,
      liquidity: 95000,
    },
  });

  // Example posts + matches
  const now = new Date();

  const aiPost = await prisma.post.upsert({
    where: {
      provider_providerPostId: {
        provider: Provider.X,
        providerPostId: "tweet_ai_1",
      },
    },
    update: {},
    create: {
      provider: Provider.X,
      providerPostId: "tweet_ai_1",
      sourceAccountId: aiSource.id,
      url: "https://x.com/ai_researcher_1/status/1",
      text: "New evals show frontier models closing the gap on long-horizon reasoning. Expect volatility in AI benchmark markets.",
      postedAt: new Date(now.getTime() - 5 * 60 * 1000),
      likeCount: 420,
      repostCount: 88,
      replyCount: 23,
    },
  });

  const electionPost = await prisma.post.upsert({
    where: {
      provider_providerPostId: {
        provider: Provider.X,
        providerPostId: "tweet_election_1",
      },
    },
    update: {},
    create: {
      provider: Provider.X,
      providerPostId: "tweet_election_1",
      sourceAccountId: electionsSource.id,
      url: "https://x.com/elections_watcher/status/2",
      text: "Fresh polling in key swing states nudges probabilities slightly toward Democrats in 2028 models.",
      postedAt: new Date(now.getTime() - 12 * 60 * 1000),
      likeCount: 310,
      repostCount: 67,
      replyCount: 19,
    },
  });

  const btcPost = await prisma.post.upsert({
    where: {
      provider_providerPostId: {
        provider: Provider.X,
        providerPostId: "tweet_btc_1",
      },
    },
    update: {},
    create: {
      provider: Provider.X,
      providerPostId: "tweet_btc_1",
      sourceAccountId: cryptoSource.id,
      url: "https://x.com/crypto_macro_guy/status/3",
      text: "ETF inflows remain relentless. BTC liquidity is thin above $90k – a single catalyst could send it through $100k.",
      postedAt: new Date(now.getTime() - 30 * 60 * 1000),
      likeCount: 690,
      repostCount: 150,
      replyCount: 42,
    },
  });

  await prisma.marketPostMatch.upsert({
    where: {
      marketId_postId: {
        marketId: aiMarket.id,
        postId: aiPost.id,
      },
    },
    update: {},
    create: {
      marketId: aiMarket.id,
      postId: aiPost.id,
      relevanceScore: 0.8,
      stanceLabel: StanceLabel.YES,
      stanceConfidence: 0.8,
      relevanceMethod: "seed_mock",
      stanceMethod: "seed_mock",
      pinned: true,
    },
  });

  await prisma.marketPostMatch.upsert({
    where: {
      marketId_postId: {
        marketId: electionMarket.id,
        postId: electionPost.id,
      },
    },
    update: {},
    create: {
      marketId: electionMarket.id,
      postId: electionPost.id,
      relevanceScore: 0.75,
      stanceLabel: StanceLabel.YES,
      stanceConfidence: 0.7,
      relevanceMethod: "seed_mock",
      stanceMethod: "seed_mock",
    },
  });

  await prisma.marketPostMatch.upsert({
    where: {
      marketId_postId: {
        marketId: btcMarket.id,
        postId: btcPost.id,
      },
    },
    update: {},
    create: {
      marketId: btcMarket.id,
      postId: btcPost.id,
      relevanceScore: 0.82,
      stanceLabel: StanceLabel.YES,
      stanceConfidence: 0.85,
      relevanceMethod: "seed_mock",
      stanceMethod: "seed_mock",
      pinned: true,
    },
  });
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


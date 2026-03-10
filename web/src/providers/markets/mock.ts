import { MarketStatus, Provider } from "@prisma/client";
import type { MarketProvider, NormalizedMarket } from "./types";

const now = () => new Date();

const minutesFromNow = (mins: number) =>
  new Date(now().getTime() + mins * 60 * 1000);

export class MockMarketProvider implements MarketProvider {
  readonly id = Provider.KALSHI;

  async fetchTopMarkets(): Promise<NormalizedMarket[]> {
    // Static mock data for local development and storybook-like usage.
    return [
      {
        provider: Provider.KALSHI,
        providerMarketId: "kalshi_ai_models_2025",
        title: "Will OpenAI's next flagship model outperform Claude on MMLU by Dec 2025?",
        subtitle: "Flagship LLM benchmarks",
        description:
          "Benchmark race between frontier labs on MMLU and reasoning-heavy evals.",
        url: "https://kalshi.com/markets/ai-model-benchmark-2025",
        rulesUrl: "https://kalshi.com/markets/ai-model-benchmark-2025/rules",
        status: MarketStatus.OPEN,
        endDate: minutesFromNow(60 * 24 * 30),
        yesProbability: 0.62,
        noProbability: 0.38,
        volume: 120000,
        liquidity: 50000,
      },
      {
        provider: Provider.POLYMARKET,
        providerMarketId: "poly_usa_pres_2028",
        title: "Will the Democratic candidate win the 2028 U.S. presidential election?",
        subtitle: "US Elections",
        description:
          "Outcome of the 2028 United States presidential election popular vote.",
        url: "https://polymarket.com/event/us-presidential-2028",
        rulesUrl:
          "https://polymarket.com/event/us-presidential-2028/description",
        status: MarketStatus.OPEN,
        endDate: minutesFromNow(60 * 24 * 365 * 3),
        yesProbability: 0.55,
        noProbability: 0.45,
        volume: 850000,
        liquidity: 210000,
      },
      {
        provider: Provider.POLYMARKET,
        providerMarketId: "poly_btc_100k_2026",
        title: "Will BTC trade above $100k at any point in 2026?",
        subtitle: "Crypto macro",
        description:
          "High-beta macro and ETF flows driving BTC price action during 2026.",
        url: "https://polymarket.com/event/btc-100k-2026",
        rulesUrl: "https://polymarket.com/event/btc-100k-2026/description",
        status: MarketStatus.OPEN,
        endDate: minutesFromNow(60 * 24 * 365),
        yesProbability: 0.48,
        noProbability: 0.52,
        volume: 430000,
        liquidity: 95000,
      },
    ];
  }
}


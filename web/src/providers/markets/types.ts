import type { Provider, MarketStatus } from "@prisma/client";

export type NormalizedMarket = {
  provider: Provider;
  providerMarketId: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  url?: string | null;
  rulesUrl?: string | null;
  status: MarketStatus;
  endDate?: Date | null;
  yesProbability: number;
  noProbability: number;
  volume?: number | null;
  liquidity?: number | null;
};

export interface MarketProvider {
  readonly id: Provider;
  fetchTopMarkets(args?: { limit?: number }): Promise<NormalizedMarket[]>;
}


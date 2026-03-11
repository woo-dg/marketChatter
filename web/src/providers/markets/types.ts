import type { Provider, MarketStatus } from "@/lib/constants";

export type NormalizedMarket = {
  provider: Provider;
  providerMarketId: string;
  providerEventId?: string | null;
  providerEventSlug?: string | null;
  eventTitle?: string | null;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  url?: string | null;
  rulesUrl?: string | null;
  status: MarketStatus;
  endDate?: Date | null;
  yesProbability: number;
  noProbability: number;
  outcomesJson?: string | null;
  outcomePricesJson?: string | null;
  volume?: number | null;
  liquidity?: number | null;
  categorySlug?: string | null;
  tags?: string[];
};

export type NormalizedTag = {
  id: string;
  slug: string;
  label: string;
};

export interface MarketProvider {
  readonly id: Provider;
  fetchTopMarkets(args?: { limit?: number }): Promise<NormalizedMarket[]>;
  fetchAllActiveMarkets(): Promise<NormalizedMarket[]>;
  fetchTags(): Promise<NormalizedTag[]>;
}

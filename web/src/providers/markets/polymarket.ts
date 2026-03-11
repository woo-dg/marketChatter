import { Provider, MarketStatus } from "@/lib/constants";
import { logger } from "@/lib/logging";
import type { MarketProvider, NormalizedMarket, NormalizedTag } from "./types";

const GAMMA_BASE = "https://gamma-api.polymarket.com";
const PAGE_SIZE = 100;
const RATE_LIMIT_MS = 250;

// ----- Gamma API response shapes -----

type GammaTag = {
  id: string;
  slug: string;
  label: string;
};

type GammaMarket = {
  id: string;
  conditionId: string;
  question: string;
  slug: string;
  outcomes: string;
  outcomePrices: string;
  active: boolean;
  closed: boolean;
  endDateIso: string | null;
  volume: string;
  liquidity: string;
  description: string;
  [key: string]: unknown;
};

type GammaEvent = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  markets: GammaMarket[];
  active: boolean;
  closed: boolean;
  tags?: GammaTag[] | null;
};

// ----- helpers -----

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function parseStatus(m: GammaMarket): MarketStatus {
  if (m.closed) return MarketStatus.RESOLVED;
  if (m.active) return MarketStatus.OPEN;
  return MarketStatus.PAUSED;
}

function normalizeMarket(
  event: GammaEvent,
  m: GammaMarket,
): NormalizedMarket {
  const outcomes: string[] = safeJsonParse(m.outcomes, ["Yes", "No"]);
  const prices: string[] = safeJsonParse(m.outcomePrices, ["0.5", "0.5"]);

  const yesIdx = outcomes.findIndex(
    (o) => o.toLowerCase() === "yes",
  );
  const noIdx = outcomes.findIndex(
    (o) => o.toLowerCase() === "no",
  );

  let yesProbability = 0.5;
  let noProbability = 0.5;

  if (yesIdx >= 0 && prices[yesIdx]) {
    yesProbability = parseFloat(prices[yesIdx]);
    noProbability = yesIdx === 0 && prices[1] ? parseFloat(prices[1]) : 1 - yesProbability;
  } else if (prices.length >= 2) {
    yesProbability = parseFloat(prices[0]);
    noProbability = parseFloat(prices[1]);
  }

  const categorySlug =
    event.tags?.[0]?.slug ?? null;

  return {
    provider: Provider.POLYMARKET,
    providerMarketId: m.id,
    providerEventId: event.id,
    providerEventSlug: event.slug,
    eventTitle: event.title,
    title: m.question || event.title,
    subtitle: event.title !== m.question ? event.title : null,
    description: m.description || event.description || null,
    url: `https://polymarket.com/event/${event.slug}`,
    rulesUrl: null,
    status: parseStatus(m),
    endDate: m.endDateIso ? new Date(m.endDateIso) : null,
    yesProbability,
    noProbability,
    outcomesJson: m.outcomes || null,
    outcomePricesJson: m.outcomePrices || null,
    volume: parseFloat(m.volume) || 0,
    liquidity: parseFloat(m.liquidity) || 0,
    categorySlug,
    tags: (event.tags ?? []).map((t) => t.label),
  };
}

// ----- Provider class -----

export class PolymarketProvider implements MarketProvider {
  readonly id = Provider.POLYMARKET;

  async fetchTags(): Promise<NormalizedTag[]> {
    const res = await fetch(`${GAMMA_BASE}/tags`);
    if (!res.ok) {
      logger.error("Failed to fetch Polymarket tags", { status: res.status });
      return [];
    }
    const data: GammaTag[] = await res.json();
    return data.map((t) => ({ id: t.id, slug: t.slug, label: t.label }));
  }

  async fetchAllActiveMarkets(): Promise<NormalizedMarket[]> {
    const all: NormalizedMarket[] = [];
    let offset = 0;

    while (true) {
      const url = `${GAMMA_BASE}/events?active=true&closed=false&limit=${PAGE_SIZE}&offset=${offset}&order=volume&ascending=false`;
      logger.info(`Fetching Polymarket events offset=${offset}`);

      const res = await fetch(url);
      if (!res.ok) {
        logger.error("Polymarket events fetch failed", { status: res.status, offset });
        break;
      }

      const events: GammaEvent[] = await res.json();
      if (!events.length) break;

      for (const event of events) {
        if (!event.markets?.length) continue;
        for (const m of event.markets) {
          all.push(normalizeMarket(event, m));
        }
      }

      offset += PAGE_SIZE;
      await sleep(RATE_LIMIT_MS);
    }

    logger.info(`Fetched ${all.length} Polymarket markets total`);
    return all;
  }

  async fetchTopMarkets(args?: { limit?: number }): Promise<NormalizedMarket[]> {
    const limit = args?.limit ?? 50;
    const url = `${GAMMA_BASE}/events?active=true&closed=false&limit=${limit}&order=volume&ascending=false`;

    const res = await fetch(url);
    if (!res.ok) {
      logger.error("Polymarket top markets fetch failed", { status: res.status });
      return [];
    }

    const events: GammaEvent[] = await res.json();
    const markets: NormalizedMarket[] = [];

    for (const event of events) {
      if (!event.markets?.length) continue;
      for (const m of event.markets) {
        markets.push(normalizeMarket(event, m));
      }
    }

    return markets;
  }
}

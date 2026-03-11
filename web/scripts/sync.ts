import { PrismaClient } from "@prisma/client";

const GAMMA_BASE = "https://gamma-api.polymarket.com";
const PAGE_SIZE = 100;
const RATE_LIMIT_MS = 200;
const MAX_PAGES = parseInt(process.env.SYNC_MAX_PAGES || "0", 10) || Infinity;

const prisma = new PrismaClient();

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

type GammaTag = { id: string; slug: string; label: string };
type GammaMarket = {
  id: string; question: string; slug: string;
  outcomes: string; outcomePrices: string;
  active: boolean; closed: boolean;
  endDateIso: string | null;
  volume: string; liquidity: string;
  description: string;
  [key: string]: unknown;
};
type GammaEvent = {
  id: string; slug: string; title: string;
  description: string | null;
  markets: GammaMarket[];
  active: boolean; closed: boolean;
  tags?: GammaTag[] | null;
};

async function syncTags(): Promise<Map<string, string>> {
  console.log("Fetching tags…");
  const res = await fetch(`${GAMMA_BASE}/tags`);
  if (!res.ok) { console.error("Failed to fetch tags", res.status); return new Map(); }
  const tags: GammaTag[] = await res.json();

  const catMap = new Map<string, string>();
  for (const t of tags) {
    const cat = await prisma.category.upsert({
      where: { tagId: t.id },
      update: { name: t.label, slug: t.slug },
      create: { tagId: t.id, slug: t.slug, name: t.label, active: true },
    });
    catMap.set(t.slug, cat.id);
  }
  console.log(`Synced ${tags.length} categories`);
  return catMap;
}

async function syncMarkets(catMap: Map<string, string>) {
  let offset = 0;
  let total = 0;
  let pages = 0;
  const seenIds = new Set<string>();

  while (pages < MAX_PAGES) {
    const url = `${GAMMA_BASE}/events?active=true&closed=false&limit=${PAGE_SIZE}&offset=${offset}&order=volume&ascending=false`;
    console.log(`Fetching events offset=${offset}…`);
    const res = await fetch(url);
    if (!res.ok) { console.error("Fetch failed", res.status); break; }
    const events: GammaEvent[] = await res.json();
    if (!events.length) break;

    for (const event of events) {
      if (!event.markets?.length) continue;
      for (const m of event.markets) {
        const outcomes: string[] = safeJsonParse(m.outcomes, ["Yes", "No"]);
        const prices: string[] = safeJsonParse(m.outcomePrices, ["0.5", "0.5"]);
        const yesIdx = outcomes.findIndex((o) => o.toLowerCase() === "yes");
        let yesP = 0.5, noP = 0.5;
        if (yesIdx >= 0 && prices[yesIdx]) {
          yesP = parseFloat(prices[yesIdx]);
          noP = yesIdx === 0 && prices[1] ? parseFloat(prices[1]) : 1 - yesP;
        } else if (prices.length >= 2) {
          yesP = parseFloat(prices[0]);
          noP = parseFloat(prices[1]);
        }

        const status = m.closed ? "RESOLVED" : m.active ? "OPEN" : "PAUSED";
        const catSlug = event.tags?.[0]?.slug ?? null;
        const categoryId = catSlug ? catMap.get(catSlug) ?? null : null;
        const slugBase = `polymarket-${m.id}`.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase().slice(0, 200);

        const market = await prisma.market.upsert({
          where: { provider_providerMarketId: { provider: "POLYMARKET", providerMarketId: m.id } },
          update: {
            title: m.question || event.title,
            subtitle: event.title !== m.question ? event.title : null,
            description: m.description || event.description || null,
            url: `https://polymarket.com/event/${event.slug}`,
            status, endDate: m.endDateIso ? new Date(m.endDateIso) : null,
            active: status === "OPEN",
            providerEventId: event.id, providerEventSlug: event.slug,
            outcomesJson: m.outcomes || null, outcomePricesJson: m.outcomePrices || null,
            volume: parseFloat(m.volume) || 0, liquidity: parseFloat(m.liquidity) || 0,
            lastSyncedAt: new Date(), categoryId,
          },
          create: {
            provider: "POLYMARKET", providerMarketId: m.id,
            providerEventId: event.id, providerEventSlug: event.slug,
            slug: slugBase,
            title: m.question || event.title,
            subtitle: event.title !== m.question ? event.title : null,
            description: m.description || event.description || null,
            url: `https://polymarket.com/event/${event.slug}`,
            status, endDate: m.endDateIso ? new Date(m.endDateIso) : null,
            active: status === "OPEN",
            outcomesJson: m.outcomes || null, outcomePricesJson: m.outcomePrices || null,
            volume: parseFloat(m.volume) || 0, liquidity: parseFloat(m.liquidity) || 0,
            lastSyncedAt: new Date(), categoryId,
          },
        });

        await prisma.marketSnapshot.create({
          data: { marketId: market.id, yesProbability: yesP, noProbability: noP, volume: parseFloat(m.volume) || 0, liquidity: parseFloat(m.liquidity) || 0 },
        });

        const tagLabels = (event.tags ?? []).map((t) => t.label);
        for (const label of tagLabels) {
          await prisma.marketTag.upsert({
            where: { marketId_label: { marketId: market.id, label } },
            update: {},
            create: { marketId: market.id, label },
          });
        }

        seenIds.add(m.id);
        total++;
      }
    }

    pages++;
    offset += PAGE_SIZE;
    console.log(`  Page ${pages} done, ${total} markets so far`);
    await sleep(RATE_LIMIT_MS);
  }

  console.log(`Done: ${total} markets upserted`);
}

async function main() {
  console.log(`Starting Polymarket sync (max pages: ${MAX_PAGES === Infinity ? "unlimited" : MAX_PAGES})…`);
  const catMap = await syncTags();
  await syncMarkets(catMap);
  console.log("Sync complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

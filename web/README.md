## MarketChatter

**MarketChatter** is a full‑stack Next.js app that aggregates top prediction markets from Kalshi & Polymarket and surfaces high‑signal posts from curated X accounts for each market. It is designed as a production‑grade foundation with a modular ingestion pipeline, relevance/stance engine, and a premium dark UI.

### Stack

- **Frontend**: Next.js (App Router), TypeScript, Tailwind (v4), Framer Motion, Lucide Icons, TanStack Query
- **Backend**: Next.js Route Handlers, Prisma, Postgres (Supabase‑compatible), optional Supabase client for future auth/assets
- **Infra/Pipeline**: Job endpoints (cron‑friendly), modular providers, Prisma‑tracked `JobRun` logs
- **AI / relevance**: Deterministic keyword relevance + heuristic stance classifier, designed to be swappable for embeddings/LLMs

### Project structure (high level)

- `src/app`
  - `page.tsx` – homepage with hero, search, featured markets grid, spotlight modal
  - `admin/page.tsx` – internal admin dashboard (categories, sources, markets, jobs)
  - `api/markets/*` – market listing/detail APIs used by the UI
  - `api/search/markets` – fuzzy-ish market search API
  - `api/jobs/*` – job endpoints for ingestion, sync, relevance/stance recompute
- `src/components`
  - `layout/navbar.tsx` – premium top nav
  - `markets/*` – `MarketCard`, `ProbabilitySplit`, `MarketSpotlightOverlay`, etc.
  - `posts/*` – X‑style `PostCard` and animated `PostCarousel`
  - `search/market-search-bar.tsx` – debounced search with keyboard support
  - `providers/query-provider.tsx` – TanStack Query config
- `src/lib`
  - `db.ts` – Prisma client
  - `config.ts`, `logging.ts`, `validation.ts`, `utils.ts`
- `src/providers`
  - `markets/*` – provider interfaces + `MockMarketProvider`
  - `x/*` – social provider interfaces + `MockXProvider`
- `src/services`
  - `marketIngestion.ts` – ingest/normalize markets + featured/trending helpers
  - `sourceSync.ts` – incremental post sync for curated X accounts
  - `relevance.ts` – keyword/entity relevance scoring and match creation
  - `stance.ts` – YES/NO/NEUTRAL heuristic stance classification
- `prisma/schema.prisma` – full DB schema
- `prisma/seed.ts` – rich seed data for local preview

### Data model (core tables)

Implemented in `prisma/schema.prisma`:

- `Category` – primary market category (AI / LLMs, elections, crypto, etc.)
- `SourceAccount` – curated X accounts with trust/priority weights and sync checkpoints
- `CategorySourceAccount` – join table between categories and sources
- `Market` – normalized markets from Kalshi/Polymarket (provider, category, status, etc.)
- `MarketSnapshot` – historical prices/probabilities for trend/sparkline use
- `Post` – normalized social posts (X)
- `MarketPostMatch` – relevance + stance for a post–market pair, with pin/hide/override flags
- `JobRun` – ingestion/worker run history with metadata and status
- `AnalyticsEvent` – generic analytics payload store
- `MarketTag` – optional secondary tags per market

Indexes are added for:

- Active markets by provider/status/end date
- Provider‑scoped IDs for markets/posts/source accounts
- Post timestamps and source IDs
- Market–post joins and pin/visibility

### Running locally

1. **Install dependencies**

```bash
cd web
npm install
```

2. **Configure environment**

```bash
cp .env.example .env
```

Make sure `DATABASE_URL` points at a Postgres instance (local Postgres or Supabase). Example:

```bash
postgresql://postgres:postgres@localhost:5432/marketchatter
```

3. **Apply migrations & generate Prisma client**

```bash
npx prisma migrate dev --name init
npm run prisma:generate
```

4. **Seed the database**

```bash
npm run db:seed
```

This seeds:

- AI / elections / crypto categories
- A few curated X accounts attached to those categories
- Three exemplar markets aligned with the mock providers
- Snapshots, posts, and `MarketPostMatch` rows wired into the UI

5. **Run the dev server**

```bash
npm run dev
```

Open `http://localhost:3000` for the main experience and `http://localhost:3000/admin` for the admin dashboard.

### Job / sync architecture

The app uses standard Next.js route handlers as job endpoints so you can wire them to **cron** (Vercel cron, GitHub Actions, or any scheduler):

- `POST /api/jobs/ingest-markets` – calls `services/marketIngestion.ingestTopMarkets()`
- `POST /api/jobs/sync-posts` – calls `services/sourceSync.syncSourcesAndPosts()`
- `POST /api/jobs/recompute-relevance` – calls:
  - `services/relevance.updateMarketPostMatchesForCategory()`
  - `services/stance.classifyStanceForMatches()`

Each job writes a `JobRun` row with status, timestamps, and error messages; the admin page surfaces a recent slice of job history.

### Providers and mock mode

Provider interfaces are defined in:

- `src/providers/markets/types.ts` – `MarketProvider`
- `src/providers/x/types.ts` – `SocialProvider`

Current implementations:

- `MockMarketProvider` – returns a static but realistic set of Kalshi/Polymarket‑like markets
- `MockXProvider` – returns deterministic posts tied to seeded source accounts

These implementations are used by the ingestion and sync services:

- `services/marketIngestion.ts`
- `services/sourceSync.ts`

To integrate real Kalshi/Polymarket/X APIs, create new provider classes that implement the same interfaces and register them in the provider arrays in the service files. Keep external API credentials in environment variables and avoid scraping; the design assumes use of official/approved APIs or server‑side data vendors.

### Relevance & stance engine

The relevance pipeline currently:

1. Restricts candidates using category‑scoped queries (markets vs. posts).
2. Uses a **keyword/overlap score** derived from tokenized market texts plus category names.
3. Persists matches when `score >= 0.12`, recording `relevanceScore` and `relevanceMethod`.
4. Optionally recomputes via `POST /api/jobs/recompute-relevance`.

The stance pipeline:

1. Uses simple keyword heuristics for YES/NO/NEUTRAL.
2. Writes `stanceLabel`, `stanceConfidence`, and `stanceMethod` onto `MarketPostMatch`.
3. Skips rows where `manualOverride` is `true`.

Both modules are intentionally lightweight and designed to be replaced by:

- Vector search / embeddings
- LLM classifiers
- Hybrid signals (polling data, external features)

Add your own implementations behind functions in `services/relevance.ts` and `services/stance.ts` without changing the DB schema.

> **Disclaimer**: Automated stance/relevance classification is probabilistic and may be wrong. The UI and README both emphasise that signals are informational only.

### Frontend UX notes

- Dark‑mode‑first with a restrained, financial‑terminal‑adjacent palette.
- Hero section + high‑signal copy, then featured markets.
- `MarketCard` shows:
  - Provider badge, category chip
  - YES/NO split with green plus / red minus in `ProbabilitySplit`
  - Signals count and subtle hover elevation/glow
- Clicking a card:
  - Blurs the background and opens `MarketSpotlightOverlay`
  - Left: market details, probabilities, description, links
  - Right: `PostCarousel` of relevant posts with stance badges
- Posts visually mirror X:
  - Avatar, display name, handle, timestamp
  - Engagement counts and “Open on X” link
  - Right‑hand stance pill (+ YES / – NO / neutral)
- Search:
  - Global search bar (`/` to focus)
  - Debounced query hitting `/api/search/markets`
  - Results open directly into the spotlight modal

### Admin workflow

The admin dashboard at `/admin` currently focuses on:

- Inspecting categories and how many curated accounts they have
- Inspecting curated X accounts, their categories, and trust/priority weights
- Inspecting recently ingested markets and a slice of job history

It is intentionally read‑heavy to keep the first iteration simple; it is straightforward to add:

- Server actions / API routes for:
  - Creating/editing/deleting categories
  - Managing `CategorySourceAccount` joins
  - Manually pinning/hiding `MarketPostMatch` rows
  - Overriding `stanceLabel`/`stanceConfidence`

### Known limitations & next steps

- **Auth**: Admin is not authenticated yet. Next step is to wire Supabase Auth or another provider and gate `/admin`.
- **Real providers**: Only mock providers are implemented; production integrations should:
  - Respect official API terms and rate limits
  - Use incremental cursors (since IDs/timestamps are already modeled)
  - Handle retries, backoff, and dead‑letter logic in a dedicated worker
- **Ranking**: Current featured/trending logic is simple; you can extend it with:
  - Velocity of price changes (based on snapshots)
  - Volume/liquidity‑weighted scores
  - Unique source counts and fresh high‑relevance signals
- **Analytics**: `AnalyticsEvent` is wired in schema but not yet instrumented in the UI. Next step is a tiny analytics client that streams events to a lightweight API route.
- **Notifications/watchlists**: DB is structured so user tables and watchlists can be added alongside `AnalyticsEvent` without reshaping the domain.

This codebase is intended as a solid, production‑minded foundation. You can evolve it toward a full startup‑grade product by deepening the provider integrations, hardening the ingestion/worker layer, and iterating on the ranking and UX over time.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

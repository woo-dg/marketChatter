import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [categories, sources, markets, jobs] = await Promise.all([
    prisma.category.findMany({
      orderBy: { createdAt: "desc" },
      include: { sources: true },
    }),
    prisma.sourceAccount.findMany({
      orderBy: { createdAt: "desc" },
      include: { categories: { include: { category: true } } },
      take: 50,
    }),
    prisma.market.findMany({
      orderBy: { createdAt: "desc" },
      include: { category: true },
      take: 50,
    }),
    prisma.jobRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Admin
        </p>
        <h1 className="text-xl font-semibold text-zinc-50">
          System health &amp; curation
        </h1>
        <p className="max-w-2xl text-xs text-zinc-500">
          Manage categories, curated X sources, and inspect ingestion and
          relevance pipelines. Overrides here take precedence over automated
          classification.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4">
          <h2 className="mb-2 text-sm font-semibold text-zinc-50">
            Categories
          </h2>
          <div className="space-y-2 text-xs text-zinc-300">
            {categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-950/90 px-2.5 py-1.5"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-[10px] text-zinc-500">/{c.slug}</span>
                  </div>
                  {c.description && (
                    <p className="text-[11px] text-zinc-500">
                      {c.description}
                    </p>
                  )}
                </div>
                <div className="text-[10px] text-zinc-500">
                  {c.sources.length} sources
                </div>
              </div>
            ))}
            {!categories.length && (
              <p className="text-[11px] text-zinc-500">
                No categories yet. Seed the database to get started.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4">
          <h2 className="mb-2 text-sm font-semibold text-zinc-50">
            Curated X sources
          </h2>
          <div className="space-y-1.5 text-xs text-zinc-300">
            {sources.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-950/90 px-2.5 py-1.5"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{s.displayName}</span>
                    <span className="text-[10px] text-zinc-500">
                      @{s.handle}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    Categories:{" "}
                    {s.categories.map((c) => c.category.name).join(", ") ||
                      "—"}
                  </p>
                </div>
                <div className="text-right text-[10px] text-zinc-500">
                  <div>Trust {s.trustScore.toFixed(2)}</div>
                  <div>Priority {s.priorityWeight.toFixed(2)}</div>
                </div>
              </div>
            ))}
            {!sources.length && (
              <p className="text-[11px] text-zinc-500">
                No curated X accounts yet. Seed the database to see examples.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4">
          <h2 className="mb-2 text-sm font-semibold text-zinc-50">
            Recent markets
          </h2>
          <div className="space-y-1.5 text-xs text-zinc-300">
            {markets.map((m) => (
              <div
                key={m.id}
                className="rounded-lg border border-zinc-800/80 bg-zinc-950/90 px-2.5 py-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="line-clamp-1 text-[11px] font-medium text-zinc-100">
                    {m.title}
                  </p>
                  <span className="text-[10px] text-zinc-500">
                    {m.provider}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-zinc-500">
                  {m.category?.name ?? "Uncategorized"} · {m.status} ·{" "}
                  {m.active ? "Active" : "Inactive"}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4">
          <h2 className="mb-2 text-sm font-semibold text-zinc-50">
            Recent jobs
          </h2>
          <div className="space-y-1.5 text-xs text-zinc-300">
            {jobs.map((j) => (
              <div
                key={j.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-950/90 px-2.5 py-1.5"
              >
                <div>
                  <p className="text-[11px] font-medium text-zinc-100">
                    {j.jobType}
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    {j.startedAt.toISOString()}
                  </p>
                </div>
                <span className="text-[10px] text-zinc-400">{j.status}</span>
              </div>
            ))}
            {!jobs.length && (
              <p className="text-[11px] text-zinc-500">
                No jobs have run yet. Use the job endpoints or a scheduler to
                invoke ingestion and relevance updates.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}


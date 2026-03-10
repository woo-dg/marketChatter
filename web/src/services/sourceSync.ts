import { Provider } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logging";
import type { SocialProvider } from "@/providers/x/types";
import { MockXProvider } from "@/providers/x/mock";

const providers: SocialProvider[] = [new MockXProvider()];

export async function syncSourcesAndPosts() {
  const job = await prisma.jobRun.create({
    data: {
      jobType: "social.syncSourcesAndPosts",
      status: "RUNNING",
      metadata: {},
    },
  });

  try {
    const accounts = await prisma.sourceAccount.findMany({
      where: { active: true, provider: Provider.X },
    });

    if (!accounts.length) {
      logger.info("No active X source accounts; skipping social sync");
      await prisma.jobRun.update({
        where: { id: job.id },
        data: { status: "SUCCESS", finishedAt: new Date() },
      });
      return;
    }

    for (const provider of providers) {
      const posts = await provider.fetchLatestForAccounts({
        accountIds: accounts.map((a) => ({
          providerUserId: a.providerUserId,
          latestSince: a.latestSyncedAt ?? undefined,
        })),
      });

      for (const p of posts) {
        const account = accounts.find(
          (a) => a.providerUserId === p.sourceProviderUserId,
        );
        if (!account) continue;

        const post = await prisma.post.upsert({
          where: {
            provider_providerPostId: {
              provider: p.provider,
              providerPostId: p.providerPostId,
            },
          },
          update: {
            url: p.url,
            text: p.text,
            postedAt: p.postedAt,
            replyCount: p.replyCount ?? 0,
            repostCount: p.repostCount ?? 0,
            likeCount: p.likeCount ?? 0,
            quoteCount: p.quoteCount ?? 0,
            mediaJson: p.mediaJson as any,
            rawJson: p.rawJson as any,
          },
          create: {
            provider: p.provider,
            providerPostId: p.providerPostId,
            sourceAccountId: account.id,
            url: p.url,
            text: p.text,
            postedAt: p.postedAt,
            replyCount: p.replyCount ?? 0,
            repostCount: p.repostCount ?? 0,
            likeCount: p.likeCount ?? 0,
            quoteCount: p.quoteCount ?? 0,
            mediaJson: p.mediaJson as any,
            rawJson: p.rawJson as any,
          },
        });

        await prisma.sourceAccount.update({
          where: { id: account.id },
          data: {
            latestSyncedPostId: post.id,
            latestSyncedAt: new Date(),
          },
        });
      }
    }

    await prisma.jobRun.update({
      where: { id: job.id },
      data: { status: "SUCCESS", finishedAt: new Date() },
    });
  } catch (error) {
    logger.error("Source/post sync failed", { error });
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


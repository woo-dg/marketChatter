import type { Provider } from "@/lib/constants";

export type NormalizedPost = {
  provider: Provider;
  providerPostId: string;
  sourceProviderUserId: string;
  url: string;
  text: string;
  postedAt: Date;
  replyCount?: number | null;
  repostCount?: number | null;
  likeCount?: number | null;
  quoteCount?: number | null;
  mediaJson?: unknown;
  rawJson?: unknown;
};

export interface SocialProvider {
  readonly id: Provider;
  fetchLatestForAccounts(args: {
    accountIds: { providerUserId: string; latestSince?: Date | null }[];
  }): Promise<NormalizedPost[]>;
}


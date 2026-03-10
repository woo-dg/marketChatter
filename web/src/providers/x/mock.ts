import { Provider } from "@prisma/client";
import type { NormalizedPost, SocialProvider } from "./types";

const now = () => new Date();

export class MockXProvider implements SocialProvider {
  readonly id = Provider.X;

  async fetchLatestForAccounts(): Promise<NormalizedPost[]> {
    // For local development we just emit a small, deterministic set.
    const baseTime = now();
    return [
      {
        provider: Provider.X,
        providerPostId: "tweet_ai_1",
        sourceProviderUserId: "ai_researcher_1",
        url: "https://x.com/ai_researcher_1/status/1",
        text: "New evals show frontier models closing the gap on long-horizon reasoning. Expect volatility in AI benchmark markets.",
        postedAt: new Date(baseTime.getTime() - 5 * 60 * 1000),
        likeCount: 420,
        repostCount: 88,
      },
      {
        provider: Provider.X,
        providerPostId: "tweet_election_1",
        sourceProviderUserId: "elections_watcher",
        url: "https://x.com/elections_watcher/status/2",
        text: "Fresh polling in key swing states nudges probabilities slightly toward Democrats in 2028 models.",
        postedAt: new Date(baseTime.getTime() - 12 * 60 * 1000),
        likeCount: 310,
        repostCount: 67,
      },
      {
        provider: Provider.X,
        providerPostId: "tweet_btc_1",
        sourceProviderUserId: "crypto_macro_guy",
        url: "https://x.com/crypto_macro_guy/status/3",
        text: "ETF inflows remain relentless. BTC liquidity is thin above $90k – a single catalyst could send it through $100k.",
        postedAt: new Date(baseTime.getTime() - 30 * 60 * 1000),
        likeCount: 690,
        repostCount: 150,
      },
    ];
  }
}


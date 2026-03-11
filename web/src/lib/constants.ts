export const Provider = {
  KALSHI: "KALSHI",
  POLYMARKET: "POLYMARKET",
  X: "X",
} as const;
export type Provider = (typeof Provider)[keyof typeof Provider];

export const MarketStatus = {
  OPEN: "OPEN",
  RESOLVED: "RESOLVED",
  CANCELLED: "CANCELLED",
  PAUSED: "PAUSED",
} as const;
export type MarketStatus = (typeof MarketStatus)[keyof typeof MarketStatus];

export const StanceLabel = {
  YES: "YES",
  NO: "NO",
  NEUTRAL: "NEUTRAL",
} as const;
export type StanceLabel = (typeof StanceLabel)[keyof typeof StanceLabel];

export const JobStatus = {
  PENDING: "PENDING",
  RUNNING: "RUNNING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
} as const;
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export const AnalyticsEventType = {
  MARKET_VIEW: "MARKET_VIEW",
  MARKET_CLICK: "MARKET_CLICK",
  MARKET_FAVORITE: "MARKET_FAVORITE",
  SEARCH: "SEARCH",
  POST_CLICK: "POST_CLICK",
  CATEGORY_VIEW: "CATEGORY_VIEW",
  CAROUSEL_INTERACTION: "CAROUSEL_INTERACTION",
} as const;
export type AnalyticsEventType =
  (typeof AnalyticsEventType)[keyof typeof AnalyticsEventType];

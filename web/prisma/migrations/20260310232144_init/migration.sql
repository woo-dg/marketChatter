-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SourceAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "profileImageUrl" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "trustScore" REAL NOT NULL DEFAULT 0.5,
    "priorityWeight" REAL NOT NULL DEFAULT 1.0,
    "latestSyncedPostId" TEXT,
    "latestSyncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CategorySourceAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "sourceAccountId" TEXT NOT NULL,
    CONSTRAINT "CategorySourceAccount_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CategorySourceAccount_sourceAccountId_fkey" FOREIGN KEY ("sourceAccountId") REFERENCES "SourceAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Market" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "providerMarketId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "url" TEXT,
    "rulesUrl" TEXT,
    "categoryId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "endDate" DATETIME,
    "resolvedOutcome" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "canonicalGroupId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Market_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "marketId" TEXT NOT NULL,
    "yesProbability" REAL NOT NULL,
    "noProbability" REAL NOT NULL,
    "volume" REAL,
    "liquidity" REAL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MarketSnapshot_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "providerPostId" TEXT NOT NULL,
    "sourceAccountId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "postedAt" DATETIME NOT NULL,
    "replyCount" INTEGER DEFAULT 0,
    "repostCount" INTEGER DEFAULT 0,
    "likeCount" INTEGER DEFAULT 0,
    "quoteCount" INTEGER DEFAULT 0,
    "mediaJson" TEXT,
    "rawJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Post_sourceAccountId_fkey" FOREIGN KEY ("sourceAccountId") REFERENCES "SourceAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketPostMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "marketId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "relevanceScore" REAL NOT NULL DEFAULT 0.0,
    "stanceLabel" TEXT,
    "stanceConfidence" REAL DEFAULT 0.0,
    "relevanceMethod" TEXT,
    "stanceMethod" TEXT,
    "rationaleSummary" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "manualOverride" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MarketPostMatch_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MarketPostMatch_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "metadata" TEXT,
    "errorMessage" TEXT
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventType" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MarketTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "marketId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MarketTag_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_active_slug_idx" ON "Category"("active", "slug");

-- CreateIndex
CREATE INDEX "SourceAccount_active_provider_idx" ON "SourceAccount"("active", "provider");

-- CreateIndex
CREATE INDEX "SourceAccount_handle_idx" ON "SourceAccount"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "SourceAccount_provider_providerUserId_key" ON "SourceAccount"("provider", "providerUserId");

-- CreateIndex
CREATE INDEX "CategorySourceAccount_categoryId_idx" ON "CategorySourceAccount"("categoryId");

-- CreateIndex
CREATE INDEX "CategorySourceAccount_sourceAccountId_idx" ON "CategorySourceAccount"("sourceAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "CategorySourceAccount_categoryId_sourceAccountId_key" ON "CategorySourceAccount"("categoryId", "sourceAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Market_slug_key" ON "Market"("slug");

-- CreateIndex
CREATE INDEX "Market_active_status_endDate_idx" ON "Market"("active", "status", "endDate");

-- CreateIndex
CREATE INDEX "Market_categoryId_active_idx" ON "Market"("categoryId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Market_provider_providerMarketId_key" ON "Market"("provider", "providerMarketId");

-- CreateIndex
CREATE INDEX "MarketSnapshot_marketId_fetchedAt_idx" ON "MarketSnapshot"("marketId", "fetchedAt");

-- CreateIndex
CREATE INDEX "Post_postedAt_idx" ON "Post"("postedAt");

-- CreateIndex
CREATE INDEX "Post_sourceAccountId_postedAt_idx" ON "Post"("sourceAccountId", "postedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Post_provider_providerPostId_key" ON "Post"("provider", "providerPostId");

-- CreateIndex
CREATE INDEX "MarketPostMatch_marketId_idx" ON "MarketPostMatch"("marketId");

-- CreateIndex
CREATE INDEX "MarketPostMatch_postId_idx" ON "MarketPostMatch"("postId");

-- CreateIndex
CREATE INDEX "MarketPostMatch_pinned_hidden_idx" ON "MarketPostMatch"("pinned", "hidden");

-- CreateIndex
CREATE UNIQUE INDEX "MarketPostMatch_marketId_postId_key" ON "MarketPostMatch"("marketId", "postId");

-- CreateIndex
CREATE INDEX "JobRun_jobType_startedAt_idx" ON "JobRun"("jobType", "startedAt");

-- CreateIndex
CREATE INDEX "JobRun_status_idx" ON "JobRun"("status");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_createdAt_idx" ON "AnalyticsEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "MarketTag_marketId_idx" ON "MarketTag"("marketId");

-- CreateIndex
CREATE INDEX "MarketTag_label_idx" ON "MarketTag"("label");

-- CreateTable
CREATE TABLE "steadfast_fraud_cache" (
    "phone" TEXT NOT NULL,
    "found" BOOLEAN NOT NULL DEFAULT false,
    "total" INTEGER NOT NULL DEFAULT 0,
    "success" INTEGER NOT NULL DEFAULT 0,
    "cancel" INTEGER NOT NULL DEFAULT 0,
    "success_rate" INTEGER NOT NULL DEFAULT 0,
    "fraud_reports" JSONB,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "steadfast_fraud_cache_pkey" PRIMARY KEY ("phone")
);

-- CreateIndex
CREATE INDEX "steadfast_fraud_cache_fetched_at_idx" ON "steadfast_fraud_cache"("fetched_at");

-- CreateTable
CREATE TABLE "steadfast_api_state" (
    "id" TEXT NOT NULL,
    "last_call_at" TIMESTAMP(3),
    "cooldown_until" TIMESTAMP(3),
    "window_start" TIMESTAMP(3),
    "window_count" INTEGER NOT NULL DEFAULT 0,
    "day_start" TIMESTAMP(3),
    "day_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "steadfast_api_state_pkey" PRIMARY KEY ("id")
);

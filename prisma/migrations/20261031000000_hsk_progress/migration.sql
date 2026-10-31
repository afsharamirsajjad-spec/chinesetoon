-- Structured HSK Practice: per-user learning progress (one row per user,
-- server-built JSON snapshot; scores graded server-side like /api/exams).
-- Additive only.

-- CreateTable
CREATE TABLE "HskProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HskProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HskProgress_userId_key" ON "HskProgress"("userId");

-- CreateIndex
CREATE INDEX "HskProgress_updatedAt_idx" ON "HskProgress"("updatedAt");

-- AddForeignKey
ALTER TABLE "HskProgress" ADD CONSTRAINT "HskProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Live support chat: anonymous visitor sessions answered from the admin panel
-- (polling-based — Vercel serverless has no WebSockets). Additive only.

-- CreateTable
CREATE TABLE "LiveChatMessage" (
    "id" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LiveChatMessage_session_createdAt_idx" ON "LiveChatMessage"("session", "createdAt");

-- CreateIndex
CREATE INDEX "LiveChatMessage_createdAt_idx" ON "LiveChatMessage"("createdAt");

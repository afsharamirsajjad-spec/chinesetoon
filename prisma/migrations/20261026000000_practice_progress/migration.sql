-- PracticeEvent: signed-in practice activity starts (Practice Hub /practice)
-- activityKey is validated server-side against src/lib/practice/registry.ts
CREATE TABLE "PracticeEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PracticeEvent_userId_createdAt_idx" ON "PracticeEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PracticeEvent_activityKey_createdAt_idx" ON "PracticeEvent"("activityKey", "createdAt");

-- AddForeignKey
ALTER TABLE "PracticeEvent" ADD CONSTRAINT "PracticeEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 📚 Homework — تکالیف: استاد تکلیف + پیوست؛ دانش‌پذیر پاسخ؛ فایل‌ها با شناسهٔ 48hex
CREATE TABLE "Homework" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "className" TEXT NOT NULL DEFAULT '',
    "dueAt" TIMESTAMP(3),
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Homework_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HomeworkSubmission" (
    "id" TEXT NOT NULL,
    "homeworkId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "feedback" TEXT,
    "feedbackAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeworkSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HomeworkFile" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "homeworkId" TEXT NOT NULL,
    "submissionId" TEXT,
    "name" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomeworkFile_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Homework_createdAt_idx" ON "Homework"("createdAt");
CREATE UNIQUE INDEX "HomeworkSubmission_homeworkId_userId_key" ON "HomeworkSubmission"("homeworkId", "userId");
CREATE INDEX "HomeworkSubmission_userId_idx" ON "HomeworkSubmission"("userId");
CREATE INDEX "HomeworkFile_homeworkId_idx" ON "HomeworkFile"("homeworkId");
CREATE INDEX "HomeworkFile_submissionId_idx" ON "HomeworkFile"("submissionId");

ALTER TABLE "HomeworkSubmission" ADD CONSTRAINT "HomeworkSubmission_homeworkId_fkey" FOREIGN KEY ("homeworkId") REFERENCES "Homework"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HomeworkSubmission" ADD CONSTRAINT "HomeworkSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HomeworkFile" ADD CONSTRAINT "HomeworkFile_homeworkId_fkey" FOREIGN KEY ("homeworkId") REFERENCES "Homework"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HomeworkFile" ADD CONSTRAINT "HomeworkFile_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "HomeworkSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

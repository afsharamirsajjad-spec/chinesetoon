-- Learning platform upgrade: educational files, admin-managed HSK practice
-- content, shared question bank, HSK exam system with immutable snapshots and
-- attempts, and the YouTube teaching-video library. Additive only.

-- CreateTable
CREATE TABLE "EducationalFile" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'other',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationalFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HskStage" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'hsk1',
    "stageNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "coverImageId" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "manuallyUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HskStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HskWord" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "hanzi" TEXT NOT NULL,
    "pinyin" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "example" TEXT NOT NULL DEFAULT '',
    "examplePinyin" TEXT NOT NULL DEFAULT '',
    "exampleEnglish" TEXT NOT NULL DEFAULT '',
    "audioFileId" TEXT,
    "imageFileId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HskWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HskGrammar" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "explanation" TEXT NOT NULL DEFAULT '',
    "structure" TEXT NOT NULL DEFAULT '',
    "examples" TEXT NOT NULL DEFAULT '[]',
    "mistakes" TEXT NOT NULL DEFAULT '[]',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HskGrammar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HskPronunciation" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "intro" TEXT NOT NULL DEFAULT '',
    "sections" TEXT NOT NULL DEFAULT '[]',
    "audioFileId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HskPronunciation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HskReading" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "form" TEXT NOT NULL DEFAULT 'text',
    "lines" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT NOT NULL DEFAULT '[]',
    "audioFileId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HskReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HskQuestion" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "hanzi" TEXT NOT NULL DEFAULT '',
    "pinyin" TEXT NOT NULL DEFAULT '',
    "options" TEXT NOT NULL DEFAULT '[]',
    "answerIndex" INTEGER,
    "matchLeft" TEXT NOT NULL DEFAULT '[]',
    "matchOptions" TEXT NOT NULL DEFAULT '[]',
    "tiles" TEXT NOT NULL DEFAULT '[]',
    "explanation" TEXT NOT NULL DEFAULT '',
    "level" TEXT NOT NULL DEFAULT 'hsk1',
    "skill" TEXT NOT NULL DEFAULT 'vocabulary',
    "stageNumber" INTEGER,
    "points" INTEGER NOT NULL DEFAULT 1,
    "difficulty" TEXT NOT NULL DEFAULT 'easy',
    "audioFileId" TEXT,
    "imageFileId" TEXT,
    "passageId" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HskQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HskExam" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "level" TEXT NOT NULL DEFAULT 'hsk1',
    "examType" TEXT NOT NULL DEFAULT 'mock',
    "durationMin" INTEGER NOT NULL DEFAULT 0,
    "passPercent" INTEGER NOT NULL DEFAULT 60,
    "questionIds" TEXT NOT NULL DEFAULT '[]',
    "randomizeQuestions" BOOLEAN NOT NULL DEFAULT false,
    "randomizeOptions" BOOLEAN NOT NULL DEFAULT false,
    "allowPause" BOOLEAN NOT NULL DEFAULT true,
    "allowReview" BOOLEAN NOT NULL DEFAULT true,
    "showCorrectAnswers" BOOLEAN NOT NULL DEFAULT true,
    "showExplanations" BOOLEAN NOT NULL DEFAULT false,
    "audioReplayLimit" INTEGER NOT NULL DEFAULT 0,
    "access" TEXT NOT NULL DEFAULT 'free',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HskExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HskExamVersion" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HskExamVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HskExamAttempt" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "userId" TEXT,
    "questionOrder" TEXT NOT NULL DEFAULT '[]',
    "answers" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "scorePercent" INTEGER,
    "passed" BOOLEAN,
    "scoreJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HskExamAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeachingVideo" (
    "id" TEXT NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "teacher" TEXT NOT NULL DEFAULT '',
    "level" TEXT NOT NULL DEFAULT 'hsk1',
    "category" TEXT NOT NULL DEFAULT 'general',
    "description" TEXT NOT NULL DEFAULT '',
    "durationLabel" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeachingVideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EducationalFile_kind_createdAt_idx" ON "EducationalFile"("kind", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "HskStage_level_stageNumber_key" ON "HskStage"("level", "stageNumber");

-- CreateIndex
CREATE INDEX "HskStage_level_published_stageNumber_idx" ON "HskStage"("level", "published", "stageNumber");

-- CreateIndex
CREATE INDEX "HskWord_stageId_sortOrder_idx" ON "HskWord"("stageId", "sortOrder");

-- CreateIndex
CREATE INDEX "HskGrammar_stageId_sortOrder_idx" ON "HskGrammar"("stageId", "sortOrder");

-- CreateIndex
CREATE INDEX "HskPronunciation_stageId_sortOrder_idx" ON "HskPronunciation"("stageId", "sortOrder");

-- CreateIndex
CREATE INDEX "HskReading_stageId_sortOrder_idx" ON "HskReading"("stageId", "sortOrder");

-- CreateIndex
CREATE INDEX "HskQuestion_level_skill_published_idx" ON "HskQuestion"("level", "skill", "published");

-- CreateIndex
CREATE INDEX "HskQuestion_stageNumber_skill_published_idx" ON "HskQuestion"("stageNumber", "skill", "published");

-- CreateIndex
CREATE UNIQUE INDEX "HskExam_slug_key" ON "HskExam"("slug");

-- CreateIndex
CREATE INDEX "HskExam_level_published_sortOrder_idx" ON "HskExam"("level", "published", "sortOrder");

-- CreateIndex
CREATE INDEX "HskExamVersion_examId_createdAt_idx" ON "HskExamVersion"("examId", "createdAt");

-- CreateIndex
CREATE INDEX "HskExamAttempt_userId_status_idx" ON "HskExamAttempt"("userId", "status");

-- CreateIndex
CREATE INDEX "HskExamAttempt_examId_status_createdAt_idx" ON "HskExamAttempt"("examId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "TeachingVideo_published_sortOrder_idx" ON "TeachingVideo"("published", "sortOrder");

-- AddForeignKeys
ALTER TABLE "HskWord" ADD CONSTRAINT "HskWord_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "HskStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HskGrammar" ADD CONSTRAINT "HskGrammar_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "HskStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HskPronunciation" ADD CONSTRAINT "HskPronunciation_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "HskStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HskReading" ADD CONSTRAINT "HskReading_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "HskStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HskExamVersion" ADD CONSTRAINT "HskExamVersion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "HskExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HskExamAttempt" ADD CONSTRAINT "HskExamAttempt_examId_fkey" FOREIGN KEY ("examId") REFERENCES "HskExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HskExamAttempt" ADD CONSTRAINT "HskExamAttempt_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "HskExamVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

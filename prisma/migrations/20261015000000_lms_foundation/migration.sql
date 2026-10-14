-- 🎓 LMS فاز ۱ — نقش استاد، ثبت‌نام کلاس، مواد آموزشی، جلسات آنلاین، اطلاعیه‌ها
-- و توسعهٔ تکالیف (اتصال کلاس + نمره‌دهی)

ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'student';

ALTER TABLE "CourseClass" ADD COLUMN "teacherId" TEXT;
ALTER TABLE "CourseClass" ADD CONSTRAINT "CourseClass_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Homework" ADD COLUMN "classId" TEXT;
ALTER TABLE "Homework" ADD COLUMN "maxScore" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_classId_fkey" FOREIGN KEY ("classId") REFERENCES "CourseClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Homework_classId_idx" ON "Homework"("classId");

ALTER TABLE "HomeworkSubmission" ADD COLUMN "score" INTEGER;
ALTER TABLE "HomeworkSubmission" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'SUBMITTED';
ALTER TABLE "HomeworkSubmission" ADD COLUMN "releasedAt" TIMESTAMP(3);
CREATE INDEX "HomeworkSubmission_status_idx" ON "HomeworkSubmission"("status");

CREATE TABLE "ClassEnrollment" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enrolledById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LearningMaterial" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "moduleLabel" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "visibleFrom" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningMaterial_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MaterialFile" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialFile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OnlineSession" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 60,
    "provider" TEXT NOT NULL DEFAULT 'external',
    "meetingUrl" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnlineSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClassAnnouncement" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "authorId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassAnnouncement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AnnouncementRead" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementRead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClassEnrollment_classId_userId_key" ON "ClassEnrollment"("classId", "userId");
CREATE INDEX "ClassEnrollment_userId_idx" ON "ClassEnrollment"("userId");
CREATE INDEX "LearningMaterial_classId_sortOrder_idx" ON "LearningMaterial"("classId", "sortOrder");
CREATE INDEX "MaterialFile_materialId_idx" ON "MaterialFile"("materialId");
CREATE INDEX "OnlineSession_classId_startsAt_idx" ON "OnlineSession"("classId", "startsAt");
CREATE INDEX "ClassAnnouncement_classId_createdAt_idx" ON "ClassAnnouncement"("classId", "createdAt");
CREATE UNIQUE INDEX "AnnouncementRead_announcementId_userId_key" ON "AnnouncementRead"("announcementId", "userId");
CREATE INDEX "AnnouncementRead_userId_idx" ON "AnnouncementRead"("userId");

ALTER TABLE "ClassEnrollment" ADD CONSTRAINT "ClassEnrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "CourseClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassEnrollment" ADD CONSTRAINT "ClassEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningMaterial" ADD CONSTRAINT "LearningMaterial_classId_fkey" FOREIGN KEY ("classId") REFERENCES "CourseClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MaterialFile" ADD CONSTRAINT "MaterialFile_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "LearningMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OnlineSession" ADD CONSTRAINT "OnlineSession_classId_fkey" FOREIGN KEY ("classId") REFERENCES "CourseClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OnlineSession" ADD CONSTRAINT "OnlineSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ClassAnnouncement" ADD CONSTRAINT "ClassAnnouncement_classId_fkey" FOREIGN KEY ("classId") REFERENCES "CourseClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassAnnouncement" ADD CONSTRAINT "ClassAnnouncement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnnouncementRead" ADD CONSTRAINT "AnnouncementRead_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "ClassAnnouncement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnnouncementRead" ADD CONSTRAINT "AnnouncementRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

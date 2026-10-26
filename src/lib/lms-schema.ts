// ---------------------------------------------------------------------------
// 🎓 LMS — بوت‌استرپ امن اسکیمای جدید روی PostgreSQL (فاز LMS-1)
//
// چرا این فایل وجود دارد؟ مهاجرت‌های جدید (homework + lms_foundation) در مخزن
// هستند ولی تا Build Command در Vercel «prisma migrate deploy» را اجرا نکند،
// روی Neon اعمال نمی‌شوند — و Prisma client از قبل انتظار ستون‌های جدید را
// دارد (مثل User.role) → هر SELECT کاربر شکست می‌خورد → خطا در ورود.
//
// این ماژول در استارت‌آپِ PostgreSQL «فقط-افزایشی» است:
//   • ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS
//   • CONSTRAINTها با DO-block گارد duplicate_object — بدون هیچ DROP یا RESET
//   • هیچ داده‌ای حذف یا بازنویسی نمی‌شود؛ اجرای تکراری آن no-op است
// (اگر مهاجرت‌ها قبلاً اعمال شده باشند، همین DDLها همه skip می‌شوند.)
//
// 🌱 ensureHskCatalog — چیدمان جدید کلاس‌ها بر مبنای HSK 1 تا 5 (به درخواست
// مالک): upsert بر اساس productId پایدار؛ کلاس‌های ادغام‌شده قدیمی archive
// می‌شوند (حذف نمی‌شوند — سفارش‌های قدیمی دست‌نخورده می‌مانند).
// ---------------------------------------------------------------------------

import { db } from '@/lib/db'

const g = globalThis as unknown as { __ctLmsSchemaPromise?: Promise<void> }

/**
 * اجرای یک‌باره در هر پروسه — شکست هرگز کش نمی‌شود: اگر runEnsure خطا دهد،
 * کش پاک می‌شود تا فراخوانی بعدی (مثلاً خودترمیمی مسیرهای پرداخت) دوباره
 * تلاش کند. (قبلاً شکست با catch در یک promise «موفق» کش می‌شد و تلاش‌های
 * بعدی همیشه بی‌اثر بودند — علت خطای ۵00 صفحهٔ پرداخت.)
 */
export function ensureLmsSchema(): Promise<void> {
  if (!g.__ctLmsSchemaPromise) {
    g.__ctLmsSchemaPromise = runEnsure().catch((e: unknown) => {
      console.error('[lms-schema] ensure failed (will retry on next call):', e instanceof Error ? e.message : e)
      g.__ctLmsSchemaPromise = undefined
    })
  }
  return g.__ctLmsSchemaPromise
}

let ddlFailures = 0

/**
 * اجرای DDL افزایشی — هر عبارت مستقل است: شکست فقط لاگ می‌شود و بقیهٔ
 * عبارت‌ها اجرا می‌شوند. یک جدولِ غایب روی دیتابیس زنده (مثلاً Homework
 * قبل از اعمال مهاجرت‌ها) نباید ستونِ حیاتیِ جدولی دیگر — مثل
 * UsdtOrder.receiptUrl — را مسدود کند. همهٔ عبارت‌ها idempotent هستند.
 */
async function ddl(sql: string, label: string): Promise<void> {
  try {
    await db.$executeRawUnsafe(sql)
  } catch (e) {
    ddlFailures++
    console.error(`[lms-schema] failed (skipped, others continue): ${label}:`, e instanceof Error ? e.message : e)
  }
}

async function runEnsure(): Promise<void> {
  ddlFailures = 0
  // ---- ستون‌های جدید روی جداول موجود (فقط افزایشی) ----
  // ☁️ ستون حیاتی پرداخت — عمداً اول از همه: رسیدهای Vercel Blob بدون آن
  // هر کوئری سفارش (create/find) با P2022 می‌شکند؛ باید حتی وقتی جدول‌های
  // LMS هنوز روی دیتابیس زنده ساخته نشده‌اند هم اعمال شود.
  await ddl(`ALTER TABLE "UsdtOrder" ADD COLUMN IF NOT EXISTS "receiptUrl" TEXT`, 'UsdtOrder.receiptUrl')
  await ddl(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'student'`, 'User.role')
  await ddl(`ALTER TABLE "CourseClass" ADD COLUMN IF NOT EXISTS "teacherId" TEXT`, 'CourseClass.teacherId')
  await ddl(`ALTER TABLE "Homework" ADD COLUMN IF NOT EXISTS "classId" TEXT`, 'Homework.classId')
  await ddl(`ALTER TABLE "Homework" ADD COLUMN IF NOT EXISTS "maxScore" INTEGER NOT NULL DEFAULT 100`, 'Homework.maxScore')
  await ddl(`ALTER TABLE "HomeworkSubmission" ADD COLUMN IF NOT EXISTS "score" INTEGER`, 'HomeworkSubmission.score')
  await ddl(`ALTER TABLE "HomeworkSubmission" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'SUBMITTED'`, 'HomeworkSubmission.status')
  await ddl(`ALTER TABLE "HomeworkSubmission" ADD COLUMN IF NOT EXISTS "releasedAt" TIMESTAMP(3)`, 'HomeworkSubmission.releasedAt')

  // ---- جدول‌های جدید ----
  // 🧭 Practice Hub — رویدادهای فعالیت تمرین (فقط افزایشی/ایدمپوتنت)
  await ddl(
    `CREATE TABLE IF NOT EXISTS "PracticeEvent" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "activityKey" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PracticeEvent_pkey" PRIMARY KEY ("id")
    )`,
    'CREATE PracticeEvent'
  )
  await ddl(`CREATE INDEX IF NOT EXISTS "PracticeEvent_userId_createdAt_idx" ON "PracticeEvent"("userId", "createdAt")`, 'idx PracticeEvent.userId')
  await ddl(`CREATE INDEX IF NOT EXISTS "PracticeEvent_activityKey_createdAt_idx" ON "PracticeEvent"("activityKey", "createdAt")`, 'idx PracticeEvent.activityKey')
  await ddl(
    `CREATE TABLE IF NOT EXISTS "ClassEnrollment" (
      "id" TEXT NOT NULL,
      "classId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "enrolledById" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ClassEnrollment_pkey" PRIMARY KEY ("id")
    )`,
    'CREATE ClassEnrollment'
  )
  await ddl(
    `CREATE TABLE IF NOT EXISTS "LearningMaterial" (
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
    )`,
    'CREATE LearningMaterial'
  )
  await ddl(
    `CREATE TABLE IF NOT EXISTS "MaterialFile" (
      "id" TEXT NOT NULL,
      "materialId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "mime" TEXT NOT NULL,
      "size" INTEGER NOT NULL,
      "url" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "MaterialFile_pkey" PRIMARY KEY ("id")
    )`,
    'CREATE MaterialFile'
  )
  await ddl(
    `CREATE TABLE IF NOT EXISTS "OnlineSession" (
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
    )`,
    'CREATE OnlineSession'
  )
  await ddl(
    `CREATE TABLE IF NOT EXISTS "ClassAnnouncement" (
      "id" TEXT NOT NULL,
      "classId" TEXT NOT NULL,
      "authorId" TEXT,
      "title" TEXT NOT NULL,
      "body" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "ClassAnnouncement_pkey" PRIMARY KEY ("id")
    )`,
    'CREATE ClassAnnouncement'
  )
  await ddl(
    `CREATE TABLE IF NOT EXISTS "AnnouncementRead" (
      "id" TEXT NOT NULL,
      "announcementId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "AnnouncementRead_pkey" PRIMARY KEY ("id")
    )`,
    'CREATE AnnouncementRead'
  )

  // ---- ایندکس‌ها ----
  await ddl(`CREATE INDEX IF NOT EXISTS "Homework_classId_idx" ON "Homework"("classId")`, 'idx Homework.classId')
  await ddl(`CREATE INDEX IF NOT EXISTS "HomeworkSubmission_status_idx" ON "HomeworkSubmission"("status")`, 'idx HomeworkSubmission.status')
  await ddl(`CREATE UNIQUE INDEX IF NOT EXISTS "ClassEnrollment_classId_userId_key" ON "ClassEnrollment"("classId", "userId")`, 'idx ClassEnrollment unique')
  await ddl(`CREATE INDEX IF NOT EXISTS "ClassEnrollment_userId_idx" ON "ClassEnrollment"("userId")`, 'idx ClassEnrollment.userId')
  await ddl(`CREATE INDEX IF NOT EXISTS "LearningMaterial_classId_sortOrder_idx" ON "LearningMaterial"("classId", "sortOrder")`, 'idx LearningMaterial')
  await ddl(`CREATE INDEX IF NOT EXISTS "MaterialFile_materialId_idx" ON "MaterialFile"("materialId")`, 'idx MaterialFile')
  await ddl(`CREATE INDEX IF NOT EXISTS "OnlineSession_classId_startsAt_idx" ON "OnlineSession"("classId", "startsAt")`, 'idx OnlineSession')
  await ddl(`CREATE INDEX IF NOT EXISTS "ClassAnnouncement_classId_createdAt_idx" ON "ClassAnnouncement"("classId", "createdAt")`, 'idx ClassAnnouncement')
  await ddl(`CREATE UNIQUE INDEX IF NOT EXISTS "AnnouncementRead_announcementId_userId_key" ON "AnnouncementRead"("announcementId", "userId")`, 'idx AnnouncementRead unique')
  await ddl(`CREATE INDEX IF NOT EXISTS "AnnouncementRead_userId_idx" ON "AnnouncementRead"("userId")`, 'idx AnnouncementRead.userId')

  // ---- کلیدهای خارجی — گارد duplicate_object (Postgres IF NOT EXISTS ندارد) ----
  const fks: Array<[string, string]> = [
    ['CourseClass', `ALTER TABLE "CourseClass" ADD CONSTRAINT "CourseClass_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`],
    ['Homework', `ALTER TABLE "Homework" ADD CONSTRAINT "Homework_classId_fkey" FOREIGN KEY ("classId") REFERENCES "CourseClass"("id") ON DELETE SET NULL ON UPDATE CASCADE`],
    ['ClassEnrollment', `ALTER TABLE "ClassEnrollment" ADD CONSTRAINT "ClassEnrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "CourseClass"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ['ClassEnrollment', `ALTER TABLE "ClassEnrollment" ADD CONSTRAINT "ClassEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ['LearningMaterial', `ALTER TABLE "LearningMaterial" ADD CONSTRAINT "LearningMaterial_classId_fkey" FOREIGN KEY ("classId") REFERENCES "CourseClass"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ['MaterialFile', `ALTER TABLE "MaterialFile" ADD CONSTRAINT "MaterialFile_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "LearningMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ['OnlineSession', `ALTER TABLE "OnlineSession" ADD CONSTRAINT "OnlineSession_classId_fkey" FOREIGN KEY ("classId") REFERENCES "CourseClass"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ['OnlineSession', `ALTER TABLE "OnlineSession" ADD CONSTRAINT "OnlineSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`],
    ['ClassAnnouncement', `ALTER TABLE "ClassAnnouncement" ADD CONSTRAINT "ClassAnnouncement_classId_fkey" FOREIGN KEY ("classId") REFERENCES "CourseClass"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ['ClassAnnouncement', `ALTER TABLE "ClassAnnouncement" ADD CONSTRAINT "ClassAnnouncement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`],
    ['AnnouncementRead', `ALTER TABLE "AnnouncementRead" ADD CONSTRAINT "AnnouncementRead_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "ClassAnnouncement"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
    ['AnnouncementRead', `ALTER TABLE "AnnouncementRead" ADD CONSTRAINT "AnnouncementRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`],
  ]
  for (const [table, statement] of fks) {
    try {
      await db.$executeRawUnsafe(statement)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('duplicate') || msg.includes('already exists')) continue // قبلاً اعمال شده
      console.error(`[lms-schema] FK on ${table} failed:`, msg)
      // کلید خارجی حیاتی برای کارکرد نیست — ادامه می‌دهیم
    }
  }

  console.info(
    `[lms-schema] LMS schema ensured (additive, idempotent${ddlFailures > 0 ? `, ${ddlFailures} statement(s) skipped — see errors above` : ''})`
  )
}

// ---------------------------------------------------------------------------
// 🌱 چیدمان HSK 1 تا 5 — upsert بر اساس productId پایدار
// slugهای موجود برای productIds موجود دست نمی‌خورند (لینک‌های قدیمی نمی‌شکنند)؛
// کلاس‌های ادغام‌شدهٔ قدیمی archive می‌شوند؛ Private Lessons سر جایش می‌ماند.
// ---------------------------------------------------------------------------

interface HskClassSeed {
  productId: string
  slug: string
  title: string
  shortDescription: string
  category: string
  level: string
  classType: string
  registerLevels: string[]
  sessionDurationMin: number
  packageSessions: number
  pricePerSession: number
  packagePrice: number
  sortOrder: number
  image: string
}

const LEGACY_GROUP_IDS = ['beginner-chinese-12', 'elementary-chinese-16', 'intermediate-chinese-16']
const MERGED_ARCHIVE_IDS = ['conversational-chinese-10', 'hsk-preparation-8']
const PRIVATE_ID = 'private-lessons-1'

const HSK_CATALOG: HskClassSeed[] = [
  {
    productId: 'beginner-chinese-12',
    slug: 'hsk-1',
    title: 'HSK 1 — Beginner Chinese',
    shortDescription: 'Start Mandarin from zero and pass HSK 1: pinyin, tones, 150 core words and simple everyday sentences.',
    category: 'beginner',
    level: 'HSK 1',
    classType: 'group',
    registerLevels: ['complete-beginner', 'beginner'],
    sessionDurationMin: 60,
    packageSessions: 12,
    pricePerSession: 130 / 12,
    packagePrice: 130,
    sortOrder: 1,
    image: '/images/classes/beginner.png',
  },
  {
    productId: 'elementary-chinese-16',
    slug: 'hsk-2',
    title: 'HSK 2 — Elementary Chinese',
    shortDescription: 'Grow to 300 words and everyday conversations — shopping, travel, directions — and pass HSK 2.',
    category: 'elementary',
    level: 'HSK 2',
    classType: 'group',
    registerLevels: ['elementary'],
    sessionDurationMin: 60,
    packageSessions: 16,
    pricePerSession: 200 / 16,
    packagePrice: 200,
    sortOrder: 2,
    image: '/images/classes/elementary.png',
  },
  {
    productId: 'hsk3-course-16',
    slug: 'hsk-3',
    title: 'HSK 3 — Pre-Intermediate Chinese',
    shortDescription: 'Reach 600 words, connect sentences smoothly and handle most daily and study situations — pass HSK 3.',
    category: 'intermediate',
    level: 'HSK 3',
    classType: 'group',
    registerLevels: ['intermediate'],
    sessionDurationMin: 60,
    packageSessions: 16,
    pricePerSession: 200 / 16,
    packagePrice: 200,
    sortOrder: 3,
    image: '/images/classes/conversation.png',
  },
  {
    productId: 'intermediate-chinese-16',
    slug: 'hsk-4',
    title: 'HSK 4 — Intermediate Chinese',
    shortDescription: 'Expand to 1,200 words, discuss opinions and abstract topics fluently, and pass HSK 4.',
    category: 'intermediate',
    level: 'HSK 4',
    classType: 'group',
    registerLevels: ['intermediate', 'advanced'],
    sessionDurationMin: 60,
    packageSessions: 16,
    pricePerSession: 200 / 16,
    packagePrice: 200,
    sortOrder: 4,
    image: '/images/classes/intermediate.png',
  },
  {
    productId: 'hsk5-course-20',
    slug: 'hsk-5',
    title: 'HSK 5 — Advanced Chinese',
    shortDescription: 'Master 2,500 words, media-level listening, structured writing and nuanced expression — pass HSK 5.',
    category: 'advanced',
    level: 'HSK 5',
    classType: 'group',
    registerLevels: ['advanced'],
    sessionDurationMin: 60,
    packageSessions: 20,
    pricePerSession: 280 / 20,
    packagePrice: 280,
    sortOrder: 5,
    image: '/images/classes/hsk-prep.png',
  },
]

async function ensureHskCatalog(): Promise<void> {
  try {
    // ۱) کلاس‌های HSK 1 تا 5 — upsert بر اساس productId پایدار
    for (const seed of HSK_CATALOG) {
      await db.courseClass.upsert({
        where: { productId: seed.productId },
        create: {
          productId: seed.productId,
          slug: seed.slug,
          title: seed.title,
          shortDescription: seed.shortDescription,
          category: seed.category,
          status: 'active',
          classType: seed.classType,
          level: seed.level,
          registerLevels: JSON.stringify(seed.registerLevels),
          sessionDurationMin: seed.sessionDurationMin,
          packageSessions: seed.packageSessions,
          pricePerSession: seed.pricePerSession,
          packagePrice: seed.packagePrice,
          priceNote: `${seed.packageSessions}-session package: $${seed.packagePrice}`,
          currency: 'USDT',
          format: 'online',
          sortOrder: seed.sortOrder,
          image: seed.image,
          highlights: '[]',
          requirements: '[]',
          audience: '[]',
          curriculum: '[]',
          materials: '[]',
          meta: JSON.stringify([
            { icon: 'monitor', text: 'Online' },
            { icon: 'clock', text: `${seed.packageSessions} sessions · ${seed.sessionDurationMin} min each` },
            { icon: 'users', text: 'Small group (4–8 students)' },
          ]),
        },
        // 🔄 بازسازی عمدی طبق درخواست مالک — عنوان/سطح/قیمتِ این ۵ محصول ثابت با چیدمان HSK هم‌رویزان می‌شود
        update: {
          title: seed.title,
          shortDescription: seed.shortDescription,
          category: seed.category,
          level: seed.level,
          classType: seed.classType,
          registerLevels: JSON.stringify(seed.registerLevels),
          sessionDurationMin: seed.sessionDurationMin,
          packageSessions: seed.packageSessions,
          pricePerSession: seed.pricePerSession,
          packagePrice: seed.packagePrice,
          priceNote: `${seed.packageSessions}-session package: $${seed.packagePrice}`,
          status: 'active',
          sortOrder: seed.sortOrder,
          image: seed.image,
        },
      })
    }

    // ۲) Private Lessons — فقط اگر غایب است (هرگز ویرایش ادمین را بازنویسی نمی‌کنیم)
    await db.courseClass.upsert({
      where: { productId: PRIVATE_ID },
      create: {
        productId: PRIVATE_ID,
        slug: 'private-lessons',
        title: 'Private Lessons',
        shortDescription: 'Personalized one-on-one instruction tailored to your level, goals, and schedule.',
        category: 'beginner elementary intermediate advanced',
        status: 'active',
        classType: 'private',
        level: 'All Levels',
        registerLevels: JSON.stringify(['complete-beginner', 'beginner', 'elementary', 'intermediate', 'advanced']),
        sessionDurationMin: 60,
        packageSessions: 1,
        pricePerSession: 25,
        packagePrice: 25,
        priceNote: 'Flexible packages — pay as you go',
        currency: 'USDT',
        format: 'online',
        sortOrder: 6,
        image: '/images/classes/private.png',
        highlights: '[]',
        requirements: '[]',
        audience: '[]',
        curriculum: '[]',
        materials: '[]',
        meta: JSON.stringify([
          { icon: 'monitor', text: 'Online' },
          { icon: 'clock', text: 'Flexible scheduling' },
          { icon: 'user', text: '1-on-1 personalized' },
        ]),
      },
      update: {},
    })

    // ۳) کلاس‌های قدیمی که در چیدمان HSK ادغام شده‌اند — archive (بدون حذف)
    const archived = await db.courseClass.updateMany({
      where: { productId: { in: MERGED_ARCHIVE_IDS }, status: { not: 'archived' } },
      data: { status: 'archived' },
    })

    // 🛡️ محصولات قدیمیِ حذف‌شده از فهرست — اگر کلاس دیگری از هر زمان با productId
    // ناشناخته فعال مانده، دست نمی‌زنیم (ادمین آزاد است)
    console.info(
      `[lms-schema] HSK 1–5 catalog ensured (${HSK_CATALOG.length} classes, ${archived.count} legacy class(es) archived)`
    )
  } catch (e) {
    console.error('[lms-schema] HSK catalog seed failed (non-fatal):', e instanceof Error ? e.message : e)
  }
}

/** اسکیما + کاتالوگ — فقط در استارت‌آپ PostgreSQL صدا زده می‌شود */
export async function ensureLmsSchemaAndCatalog(): Promise<void> {
  await ensureLmsSchema()
  await ensureHskCatalog()
}

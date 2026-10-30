-- Lesson free-form content: long-form text body rendered on /lesson/<slug>
-- (owner request: lessons should support prose, not only word lists).
-- Additive + idempotent; default '' keeps existing rows intact.

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "content" TEXT NOT NULL DEFAULT '';

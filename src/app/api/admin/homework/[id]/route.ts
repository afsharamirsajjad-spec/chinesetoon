// ---------------------------------------------------------------------------
// 📚 /api/admin/homework/[id] — تکلیفِ واحد از دید استاد
//
//   GET    — جزئیات + همهٔ پاسخ‌های دانش‌پذیران (نام/کد یکتا/فایل‌ها/بازخورد)
//   PATCH  — ویرایش عنوان/توضیح/کلاس/مهلت یا آرشیو/بازگردانی
//   DELETE — حذف کامل تکلیف + فایل‌های فیزیکی آن
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAuthorized, getAdminActor } from '@/lib/admin-auth'
import { isSameOrigin } from '@/lib/http-guard'
import { logAdminAction } from '@/lib/audit'
import { deleteHomeworkFile, HOMEWORK_FILE_EXT_BY_MIME } from '@/lib/homework-files'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await ctx.params
  try {
    const homework = await db.homework.findUnique({
      where: { id },
      include: {
        files: {
          orderBy: { createdAt: 'asc' },
        },
        submissions: {
          orderBy: { updatedAt: 'desc' },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, uniqueCode: true } },
            files: { orderBy: { createdAt: 'asc' } },
          },
        },
      },
    })
    if (!homework) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }
    return NextResponse.json({ homework })
  } catch (e) {
    console.error('[GET /api/admin/homework/:id] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await ctx.params
  try {
    const body = (await req.json()) as {
      title?: unknown
      description?: unknown
      className?: unknown
      dueAt?: unknown
      archived?: unknown
    }
    const data: Prisma.HomeworkUpdateInput = {}
    if (typeof body.title === 'string') {
      const t = body.title.trim().slice(0, 160)
      if (t.length < 2) return NextResponse.json({ error: 'Title is too short' }, { status: 400 })
      data.title = t
    }
    if (typeof body.description === 'string') data.description = body.description.trim().slice(0, 4000)
    if (typeof body.className === 'string') data.className = body.className.trim().slice(0, 120)
    if (typeof body.dueAt === 'string') {
      const t = Date.parse(body.dueAt)
      if (!body.dueAt) {
        data.dueAt = null
      } else if (!Number.isFinite(t)) {
        return NextResponse.json({ error: 'Invalid due date' }, { status: 400 })
      } else {
        data.dueAt = new Date(t)
      }
    }
    if (typeof body.archived === 'boolean') data.archived = body.archived

    const updated = await db.homework.update({ where: { id }, data })
    logAdminAction({
      actor: getAdminActor(req),
      action: body.archived === true ? 'homework.archive' : 'homework.update',
      targetType: 'HOMEWORK',
      targetId: id,
    })
    return NextResponse.json({ ok: true, homework: updated })
  } catch (e) {
    const notFound = e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025'
    if (notFound) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    console.error('[PATCH /api/admin/homework/:id] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Could not update the assignment' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await ctx.params
  try {
    // فایل‌ها را اول می‌خوانیم (Cascade رکوردها را پاک می‌کند اما فایل فیزیکی نه)
    const homework = await db.homework.findUnique({
      where: { id },
      include: {
        files: true,
        submissions: { include: { files: true } },
      },
    })
    if (!homework) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }
    await db.homework.delete({ where: { id } })
    // حذف فیزیکی بهترین‌تلاش — پس از حذف رکوردها
    const physical = [
      ...homework.files,
      ...homework.submissions.flatMap((s) => s.files),
    ]
    await Promise.all(
      physical.map((f) => deleteHomeworkFile(f.id, HOMEWORK_FILE_EXT_BY_MIME[f.mime] ?? '', f.url))
    )
    logAdminAction({
      actor: getAdminActor(req),
      action: 'homework.delete',
      targetType: 'HOMEWORK',
      targetId: id,
      meta: { title: homework.title, files: physical.length },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[DELETE /api/admin/homework/:id] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Could not delete the assignment' }, { status: 500 })
  }
}

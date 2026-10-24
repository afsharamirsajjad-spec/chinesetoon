// ---------------------------------------------------------------------------
// 💳 GET /api/admin/payments — فهرست سفارش‌های پرداخت برای پنل ادمین (فاز ۵۹)
//
// فیلترها: unpaid (پرداخت‌نشدهٔ باز) | receipt_submitted | approved | rejected
//          | cancelled | expired (پرداخت‌نشدهٔ منقضی) | legacy (جریان قدیمی USDT)
// جست‌وجو: شناسهٔ سفارش / نام / ایمیل / عنوان کلاس / ایمیل یا نام کاربر
// پاسخ: ردیف‌های آمادهٔ نمایش + شمارندهٔ هر فیلتر برای badge تب
//
// 🛡️ سخت‌سازی (رفع 500 تولیدی):
//  • select صریح — فقط فیلدهایی که پاسخ لازم دارد (کوئریِ full-row با هر
//    ناهم‌خوانی ستونِ بلااستفاده بین اسکیمای client و دیتابیس می‌شکند)
//  • خودترمیمی اسکیما: خطای P2021/P2022 (جدول/ستون غایب) → DDL افزایشیِ امن
//    یک‌بار اجرا و درخواست دقیقاً یک‌بار دوباره تلاش می‌شود (هم‌قرارداد با
//    /api/auth/login) — هیچ داده‌ای حذف نمی‌شود
//  • خطا با code + refId برگردانده می‌شود (قابل گزارش؛ بدون نشت جزئیات دیتابیس)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { isAuthorized } from '@/lib/admin-auth'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'
import { db } from '@/lib/db'
import { deriveOrderStatus, microToUsdString } from '@/lib/order-status'
import { getAdminPaymentCounts } from '@/lib/payments/service'
import { isSchemaDriftError } from '@/lib/ensure-schema'

export const dynamic = 'force-dynamic'

type StatusFilter = 'all' | 'unpaid' | 'receipt_submitted' | 'approved' | 'rejected' | 'cancelled' | 'expired' | 'legacy'

/** اعتبارسنجی امن پارامترهای صفحه‌بندی — مقادیر خراب/منفی/اعشاری به عدد صحیح امن می‌رسند
 *  (skip پرستما باید int باشد؛ page=1.9 خام → خطای اعتبارسنجی پرستما → 500) */
export function parsePaginationParams(searchParams: URLSearchParams): { page: number; pageSize: number } {
  const page = Math.max(1, Math.floor(Number(searchParams.get('page') || '1') || 1))
  const pageSize = Math.floor(Math.min(100, Math.max(5, Number(searchParams.get('pageSize') || '25') || 25)))
  return { page, pageSize }
}

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ۱۲۰ درخواست در دقیقه — پنل ادمین
  const rl = await rateLimit('admin-payments', req, 120, 60, 60)
  if (!rl.ok) return tooManyRequests(rl)

  const url = new URL(req.url)
  const status = (url.searchParams.get('status') || 'all') as StatusFilter
  const q = (url.searchParams.get('q') || '').trim().slice(0, 80)
  const { page, pageSize } = parsePaginationParams(url.searchParams)
  const now = new Date()

  const where: Record<string, unknown> = {}
  switch (status) {
    case 'unpaid':
      where.status = 'PENDING'
      break
    case 'receipt_submitted':
      where.status = 'RECEIPT_SUBMITTED'
      break
    case 'approved':
      where.status = 'PAID'
      break
    case 'rejected':
      where.status = 'REJECTED'
      break
    case 'cancelled':
      where.status = 'CANCELLED'
      break
    case 'expired':
      where.status = 'PENDING'
      where.expiresAt = { lte: now }
      break
    case 'legacy':
      where.paymentMethod = 'USDT_TRON'
      break
    default:
      break
  }

  if (q) {
    where.OR = [
      { ref: { contains: q.toUpperCase() } },
      { contactName: { contains: q } },
      { contactEmail: { contains: q } },
      { productTitle: { contains: q } },
      { user: { is: { OR: [{ email: { contains: q } }, { firstName: { contains: q } }, { lastName: { contains: q } }] } } },
    ]
  }

  // 🔒 select صریح — دقیقاً فیلدهای پاسخ؛ deriveOrderStatus فقط status/expiresAt می‌خواهد
  const orderSelect = {
    ref: true,
    status: true,
    paymentMethod: true,
    productTitle: true,
    productId: true,
    contactName: true,
    contactEmail: true,
    expectedMicro: true,
    currency: true,
    baseAmount: true,
    tierPercent: true,
    discountCode: true,
    discountAmount: true,
    discountType: true,
    discountValue: true,
    receiptStatus: true,
    receiptSubmittedAt: true,
    receiptResubmits: true,
    rejectionReason: true,
    reviewedAt: true,
    reviewedBy: true,
    paidAt: true,
    createdAt: true,
    updatedAt: true,
    expiresAt: true,
    user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, country: true } },
  } as const

  type OrderRow = {
    ref: string
    status: string
    paymentMethod: string
    productTitle: string
    productId: string
    contactName: string | null
    contactEmail: string | null
    expectedMicro: number
    currency: string
    baseAmount: string | number | null
    tierPercent: number | null
    discountCode: string | null
    discountAmount: string | number | null
    discountType: string | null
    discountValue: string | number | null
    receiptStatus: string | null
    receiptSubmittedAt: Date | null
    receiptResubmits: number
    rejectionReason: string | null
    reviewedAt: Date | null
    reviewedBy: string | null
    paidAt: Date | null
    createdAt: Date
    updatedAt: Date
    expiresAt: Date
    user: { id: string; firstName: string; lastName: string; email: string; phone: string | null; country: string } | null
  }

  const attempt = async (): Promise<NextResponse> => {
    const [total, orders, counts] = await Promise.all([
      db.usdtOrder.count({ where }),
      db.usdtOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: orderSelect,
      }),
      getAdminPaymentCounts(),
    ])

    return NextResponse.json({
      total,
      page,
      pageSize,
      counts,
      orders: (orders as OrderRow[]).map((o) => {
        const derived = deriveOrderStatus(o)
        return {
          ref: o.ref,
          status: derived,
          rawStatus: o.status,
          paymentMethod: o.paymentMethod,
          productTitle: o.productTitle,
          productId: o.productId,
          amountUsd: microToUsdString(o.expectedMicro),
          currency: o.currency,
          baseAmount: o.baseAmount,
          tierPercent: o.tierPercent,
          discountCode: o.discountCode,
          discountAmount: o.discountAmount,
          discountType: o.discountType,
          discountValue: o.discountValue,
          receiptStatus: o.receiptStatus,
          receiptSubmittedAt: o.receiptSubmittedAt?.toISOString() ?? null,
          receiptResubmits: o.receiptResubmits,
          rejectionReason: o.rejectionReason,
          reviewedAt: o.reviewedAt?.toISOString() ?? null,
          reviewedBy: o.reviewedBy,
          paidAt: o.paidAt?.toISOString() ?? null,
          createdAt: o.createdAt.toISOString(),
          updatedAt: o.updatedAt.toISOString(),
          expiresAt: o.expiresAt.toISOString(),
          customer: o.user
            ? {
                id: o.user.id,
                name: `${o.user.firstName} ${o.user.lastName}`.trim(),
                email: o.user.email,
                phone: o.user.phone,
                country: o.user.country,
              }
            : {
                id: null,
                name: o.contactName,
                email: o.contactEmail,
                phone: null,
                country: null,
              },
        }
      }),
    })
  }

  try {
    return await attempt()
  } catch (initialError) {
    let e: unknown = initialError
    // 🛠️ خودترمیمی اسکیما — P2021/P2022 (جدول/ستون غایب روی دیتابیس زنده):
    // DDL افزایشیِ امن یک‌بار اجرا و درخواست دقیقاً یک‌بار دوباره تلاش می‌شود
    if (isSchemaDriftError(e)) {
      try {
        const { ensureLmsSchema } = await import('@/lib/lms-schema')
        await ensureLmsSchema()
        return await attempt()
      } catch (retryError) {
        e = retryError
      }
    }
    console.error('[admin/payments] list failed:', e instanceof Error ? e.message : e)
    const errRef = randomBytes(4).toString('hex').toUpperCase()
    try {
      const { logAppError } = await import('@/lib/error-log')
      logAppError({
        category: 'ORDER',
        error: e,
        fallback: 'Admin payments list failed',
        context: { path: '/api/admin/payments', method: 'GET' },
        refId: errRef,
      })
    } catch {
      /* لاگ‌گیری هرگز مسیر اصلی را نمی‌شکند */
    }
    return NextResponse.json(
      { error: 'Failed to load payments. Please try again.', ref: errRef },
      { status: 500 }
    )
  }
}

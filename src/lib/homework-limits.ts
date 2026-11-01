// ---------------------------------------------------------------------------
// 📚 سقف‌های آپلود تکالیف — نسخهٔ client-safe (بدون هیچ import سمت سرور)
//
// هم مسیرهای API و هم فرم‌های مرورگر از همین اعداد استفاده می‌کنند تا سقفی که
// UI وعده می‌دهد با سقفی که سرور اعمال می‌کند یکی باشد. مجموع فایل‌های «یک
// درخواست» باید زیر سقف بدنهٔ ۴.۵MB فانکشن‌های serverless ورسل بماند — بالاتر
// از آن خودِ پلتفرم 413 می‌دهد و پیام خطای ما به کاربر نمی‌رسد (همان تجربهٔ
// «بارگذاری تکالیف کار نمی‌کند» برای عکس‌های بزرگ گوشی).
// ---------------------------------------------------------------------------

/** سقف هر فایل — ۴ مگابایت */
export const MAX_HOMEWORK_FILE_BYTES = 4 * 1024 * 1024

/** حداکثر تعداد فایل در هر ارسال */
export const MAX_HOMEWORK_FILES_PER_UPLOAD = 5

/** سقف مجموع فایل‌های یک درخواست — ۴ مگابایت (زیر سقف ۴.۵MB ورسل) */
export const MAX_HOMEWORK_TOTAL_BYTES = 4 * 1024 * 1024

/** نمایش خوانای حجم */
export function homeworkBytesLabel(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * اعتبارسنجی سمت مرورگر قبل از آپلود — پیام خطای انگلیسی رویکردرست برمی‌گرداند
 * یا null وقتی همهٔ فایل‌ها قابل ارسال‌اند. (نام فایل فقط برای نمایش استفاده
 * می‌شود؛ پاک‌سازی نهایی در سرور انجام می‌شود.)
 */
export function homeworkUploadError(files: Array<{ name: string; size: number }>): string | null {
  if (files.length > MAX_HOMEWORK_FILES_PER_UPLOAD) {
    return `Max ${MAX_HOMEWORK_FILES_PER_UPLOAD} files per submission.`
  }
  for (const f of files) {
    if (f.size > MAX_HOMEWORK_FILE_BYTES) {
      return `"${f.name}" is too large — max ${homeworkBytesLabel(MAX_HOMEWORK_FILE_BYTES)} per file. Compress the photo or export a smaller PDF and try again.`
    }
  }
  const total = files.reduce((sum, f) => sum + f.size, 0)
  if (total > MAX_HOMEWORK_TOTAL_BYTES) {
    return `Selected files add up to ${homeworkBytesLabel(total)} — max ${homeworkBytesLabel(MAX_HOMEWORK_TOTAL_BYTES)} total per submission. Remove a file or upload smaller ones.`
  }
  return null
}

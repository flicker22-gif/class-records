import { and, eq } from 'drizzle-orm'
import { customAlphabet } from 'nanoid'
import { students } from '~/server/db/schema'

export const generateShareToken = customAlphabet(
  '0123456789abcdefghijklmnopqrstuvwxyz',
  16,
)

export const PACKAGE_OPTIONS = [20, 40, 60]
export const LOW_REMAINING_THRESHOLD = 5
export const EXPIRING_SOON_DAYS_30 = 30
export const EXPIRING_SOON_DAYS_7 = 7

/**
 * 当前有效课时包：未过期且未用完；多个时取最早到期者。
 * 与家长查询页、后台总览、签到扣课保持同一口径。
 */
export function getActivePackage<
  T extends { expiresAt: Date; usedClasses: number; totalClasses: number },
>(packages: T[], now: Date = new Date()): T | undefined {
  const nowMs = now.getTime()
  return packages
    .filter((p) => p.expiresAt.getTime() > nowMs && p.usedClasses < p.totalClasses)
    .sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime())[0]
}

export function formatDate(d: Date | string | number): string {
  const date = d instanceof Date ? d : new Date(d)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

export function today(): string {
  return formatDate(new Date())
}

/** 取属于指定老师的学员；不存在或不属于该老师时抛 404 */
export function getOwnedStudent(studentId: number, teacherId: number) {
  const db = useDb()
  const student = db
    .select()
    .from(students)
    .where(and(eq(students.id, studentId), eq(students.teacherId, teacherId)))
    .get()
  if (!student) {
    throw createError({ statusCode: 404, statusMessage: '学员不存在' })
  }
  return student
}

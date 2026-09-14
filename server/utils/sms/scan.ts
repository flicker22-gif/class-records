import { and, eq } from 'drizzle-orm'
import { classPackages, smsLogs, students } from '~/server/db/schema'
import {
  EXPIRING_SOON_DAYS_30,
  EXPIRING_SOON_DAYS_7,
  LOW_REMAINING_THRESHOLD,
  formatDate,
  getActivePackage,
} from '~/server/utils/helpers'
import { getSmsSettings, resolveSmsMode } from './config'
import { normalizePhone } from './phone'
import { dispatchSms } from './provider'
import { renderSms } from './templates'
import type { ScanItem, ScanSummary, SkipReason } from './types'

const DAY_MS = 24 * 60 * 60 * 1000

// 模块级并发锁：定时扫描与手动触发撞车时，只允许一个在跑
let running = false

function emptySummary(mode: ScanSummary['mode'], modeNote?: string): ScanSummary {
  return {
    ranAt: Date.now(),
    mode,
    modeNote,
    counts: { sent: 0, logged: 0, failed: 0, skipped: 0 },
    items: [],
  }
}

export function isScanRunning() {
  return running
}

/**
 * 扫描全部学员的当前有效课时包，按规则发送续费提醒。
 * 去重的唯一依据是 sms_log 中 status='sent' 的记录（见 partial unique index）。
 */
export async function runSmsScan(): Promise<ScanSummary> {
  if (running) {
    const summary = emptySummary(resolveSmsMode().mode, '上一次扫描仍在进行中，本次跳过')
    summary.counts.skipped = 1
    summary.items.push({
      studentId: 0,
      studentName: '',
      packageId: 0,
      notifyType: 'low',
      phone: null,
      content: '',
      outcome: 'skipped',
      reason: 'scan_busy',
    })
    return summary
  }

  running = true
  try {
    const db = useDb()
    const { mode, note } = resolveSmsMode()
    const summary = emptySummary(mode, note)
    const now = new Date()
    const nowMs = now.getTime()

    const allStudents = db.select().from(students).all()
    const allPackages = db.select().from(classPackages).all()
    const packagesByStudent = new Map<number, typeof allPackages>()
    for (const pkg of allPackages) {
      const list = packagesByStudent.get(pkg.studentId) || []
      list.push(pkg)
      packagesByStudent.set(pkg.studentId, list)
    }

    const record = (item: ScanItem) => {
      summary.items.push(item)
      if (item.outcome === 'skipped') summary.counts.skipped += 1
      else summary.counts[item.outcome] += 1
    }

    for (const student of allStudents) {
      const activePackage = getActivePackage(packagesByStudent.get(student.id) || [], now)
      if (!activePackage) continue // 无有效包（已用完/全过期），不发

      const remaining = activePackage.totalClasses - activePackage.usedClasses
      const daysLeft = Math.ceil((activePackage.expiresAt.getTime() - nowMs) / DAY_MS)

      const notifyTypes: ScanItem['notifyType'][] = []
      if (remaining <= LOW_REMAINING_THRESHOLD) notifyTypes.push('low')
      // 30 天窗口（7 < daysLeft <= 30）与 7 天窗口（daysLeft <= 7）互斥，
      // 迟到部署补发时不致同一晚连发两条临期短信
      if (remaining > 0 && daysLeft <= EXPIRING_SOON_DAYS_30 && daysLeft > EXPIRING_SOON_DAYS_7) {
        notifyTypes.push('expiring_30')
      }
      if (remaining > 0 && daysLeft <= EXPIRING_SOON_DAYS_7) {
        notifyTypes.push('expiring_7')
      }
      if (notifyTypes.length === 0) continue

      const phone = normalizePhone(student.phone)

      for (const notifyType of notifyTypes) {
        const sentRow = db
          .select({ id: smsLogs.id })
          .from(smsLogs)
          .where(
            and(
              eq(smsLogs.packageId, activePackage.id),
              eq(smsLogs.notifyType, notifyType),
              eq(smsLogs.status, 'sent'),
            ),
          )
          .get()
        if (sentRow) {
          record({
            studentId: student.id,
            studentName: student.name,
            packageId: activePackage.id,
            notifyType,
            phone,
            content: '',
            outcome: 'skipped',
            reason: 'already_sent',
          })
          continue
        }

        const rendered = renderSms(
          notifyType,
          {
            studentName: student.name,
            remaining,
            daysLeft,
            expireDate: formatDate(activePackage.expiresAt),
          },
          getSmsSettings(),
        )

        if (!phone) {
          record({
            studentId: student.id,
            studentName: student.name,
            packageId: activePackage.id,
            notifyType,
            phone: student.phone || null,
            content: rendered.text,
            outcome: 'skipped',
            reason: student.phone ? 'invalid_phone' : 'no_phone',
          })
          continue
        }

        const outcome = await dispatchSms(phone, rendered)
        try {
          db.insert(smsLogs)
            .values({
              studentId: student.id,
              packageId: activePackage.id,
              notifyType,
              phone,
              content: rendered.text,
              status: outcome.status,
              error: outcome.error ?? null,
            })
            .run()
        } catch (e) {
          // 极端竞态（定时/手动并发）下 partial unique index 兜底
          record({
            studentId: student.id,
            studentName: student.name,
            packageId: activePackage.id,
            notifyType,
            phone,
            content: rendered.text,
            outcome: 'skipped',
            reason: 'already_sent' as SkipReason,
          })
          continue
        }

        record({
          studentId: student.id,
          studentName: student.name,
          packageId: activePackage.id,
          notifyType,
          phone,
          content: rendered.text,
          outcome: outcome.status,
          error: outcome.error,
        })
      }
    }

    console.log('[sms] scan done', summary.counts)
    return summary
  } finally {
    running = false
  }
}

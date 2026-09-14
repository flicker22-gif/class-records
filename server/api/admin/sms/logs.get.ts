import { desc, eq } from 'drizzle-orm'
import { smsLogs, students } from '~/server/db/schema'
import { getSmsSettings, resolveSmsMode } from '~/server/utils/sms/config'

export default defineEventHandler(async (event) => {
  await requireTeacher(event)
  const db = useDb()

  const rows = db
    .select({
      id: smsLogs.id,
      studentId: smsLogs.studentId,
      studentName: students.name,
      packageId: smsLogs.packageId,
      notifyType: smsLogs.notifyType,
      phone: smsLogs.phone,
      content: smsLogs.content,
      status: smsLogs.status,
      error: smsLogs.error,
      createdAt: smsLogs.createdAt,
    })
    .from(smsLogs)
    .leftJoin(students, eq(smsLogs.studentId, students.id))
    .orderBy(desc(smsLogs.id))
    .limit(50)
    .all()

  const { mode, note } = resolveSmsMode()
  const s = getSmsSettings()

  return {
    channel: {
      mode,
      note,
      signName: s.signName || null,
      templates: {
        low: !!s.templateLow,
        expiring: !!s.templateExpiring,
      },
    },
    logs: rows.map((r) => ({ ...r, createdAt: r.createdAt.getTime() })),
  }
})

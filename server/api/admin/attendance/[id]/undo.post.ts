import { and, eq, isNull } from 'drizzle-orm'
import { attendance, classPackages } from '~/server/db/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDb()
  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid attendance id' })
  }

  const record = db
    .select()
    .from(attendance)
    .where(and(eq(attendance.id, id), isNull(attendance.cancelledAt)))
    .get()

  if (!record) {
    throw createError({ statusCode: 404, statusMessage: 'Attendance record not found or already cancelled' })
  }

  const pkg = db.select().from(classPackages).where(eq(classPackages.id, record.packageId)).get()
  if (!pkg) {
    throw createError({ statusCode: 500, statusMessage: 'Associated package not found' })
  }

  db.update(attendance)
    .set({ cancelledAt: new Date() })
    .where(eq(attendance.id, id))
    .run()

  db.update(classPackages)
    .set({ usedClasses: Math.max(0, pkg.usedClasses - 1) })
    .where(eq(classPackages.id, pkg.id))
    .run()

  return { ok: true }
})

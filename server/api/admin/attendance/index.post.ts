import { and, asc, eq, gt, lt } from 'drizzle-orm'
import { attendance, classPackages } from '~/server/db/schema'
import { today } from '~/server/utils/helpers'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDb()
  const body = await readBody(event)
  const { studentId, classDate } = body
  const sid = Number(studentId)
  if (!sid) {
    throw createError({ statusCode: 400, statusMessage: 'studentId required' })
  }

  const date = classDate ? String(classDate) : today()
  const now = new Date()

  const pkg = await db.query.classPackages.findFirst({
    where: and(
      eq(classPackages.studentId, sid),
      gt(classPackages.expiresAt, now),
      lt(classPackages.usedClasses, classPackages.totalClasses),
    ),
    orderBy: asc(classPackages.expiresAt),
  })

  if (!pkg) {
    throw createError({ statusCode: 400, statusMessage: 'No active package available for this student' })
  }

  const record = db
    .insert(attendance)
    .values({
      studentId: sid,
      packageId: pkg.id,
      classDate: date,
      createdAt: now,
    })
    .returning()
    .get()

  db.update(classPackages)
    .set({ usedClasses: pkg.usedClasses + 1 })
    .where(eq(classPackages.id, pkg.id))
    .run()

  return { record, package: { ...pkg, usedClasses: pkg.usedClasses + 1 } }
})

import { and, desc, eq, isNull } from 'drizzle-orm'
import { attendance, classPackages, students } from '~/server/db/schema'
import { LOW_REMAINING_THRESHOLD } from '~/server/utils/helpers'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Token required' })
  }

  const student = db.select().from(students).where(eq(students.shareToken, token)).get()
  if (!student) {
    throw createError({ statusCode: 404, statusMessage: 'Student not found' })
  }

  const now = new Date()
  const packages = db
    .select()
    .from(classPackages)
    .where(eq(classPackages.studentId, student.id))
    .orderBy(desc(classPackages.createdAt))
    .all()

  const activePackage = packages
    .filter((p) => p.expiresAt.getTime() > now.getTime() && p.usedClasses < p.totalClasses)
    .sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime())[0]

  const remaining = activePackage ? activePackage.totalClasses - activePackage.usedClasses : 0

  const history = db
    .select()
    .from(attendance)
    .where(and(eq(attendance.studentId, student.id), isNull(attendance.cancelledAt)))
    .orderBy(desc(attendance.classDate), desc(attendance.createdAt))
    .all()

  return {
    student: {
      id: student.id,
      name: student.name,
      birthDate: student.birthDate,
    },
    activePackage: activePackage
      ? {
          id: activePackage.id,
          totalClasses: activePackage.totalClasses,
          usedClasses: activePackage.usedClasses,
          remaining,
          expiresAt: activePackage.expiresAt.getTime(),
          isLow: remaining <= LOW_REMAINING_THRESHOLD,
          isExpired: activePackage.expiresAt.getTime() <= now.getTime(),
        }
      : null,
    history: history.map((h) => ({
      id: h.id,
      classDate: h.classDate,
      createdAt: h.createdAt.getTime(),
    })),
  }
})

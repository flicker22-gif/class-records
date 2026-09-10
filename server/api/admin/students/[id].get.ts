import { and, desc, eq } from 'drizzle-orm'
import { attendance, classPackages, students } from '~/server/db/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDb()
  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid student id' })
  }

  const student = db.select().from(students).where(eq(students.id, id)).get()
  if (!student) {
    throw createError({ statusCode: 404, statusMessage: 'Student not found' })
  }

  const packages = db
    .select()
    .from(classPackages)
    .where(eq(classPackages.studentId, id))
    .orderBy(desc(classPackages.createdAt))
    .all()

  const records = db
    .select()
    .from(attendance)
    .where(eq(attendance.studentId, id))
    .orderBy(desc(attendance.classDate), desc(attendance.createdAt))
    .all()

  return { student, packages, attendance: records }
})

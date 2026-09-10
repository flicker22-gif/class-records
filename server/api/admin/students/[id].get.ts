import { desc, eq } from 'drizzle-orm'
import { attendance, classPackages } from '~/server/db/schema'
import { getOwnedStudent } from '~/server/utils/helpers'

export default defineEventHandler(async (event) => {
  const teacher = await requireTeacher(event)
  const db = useDb()
  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid student id' })
  }

  // 不属于当前老师的学员一律按不存在处理
  const student = getOwnedStudent(id, teacher.id)

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

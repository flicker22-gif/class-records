import { and, asc, eq, gt, lt } from 'drizzle-orm'
import { attendance, classPackages } from '~/server/db/schema'
import { getOwnedStudent, today } from '~/server/utils/helpers'

export default defineEventHandler(async (event) => {
  const teacher = await requireTeacher(event)
  const db = useDb()
  const body = await readBody(event)
  const { studentId, classDate } = body
  const sid = Number(studentId)
  if (!sid) {
    throw createError({ statusCode: 400, statusMessage: 'studentId required' })
  }

  // 只能给自己负责的学员签到
  getOwnedStudent(sid, teacher.id)

  const date = classDate ? String(classDate) : today()
  const now = new Date()

  const pkg = db
    .select()
    .from(classPackages)
    .where(
      and(
        eq(classPackages.studentId, sid),
        gt(classPackages.expiresAt, now),
        lt(classPackages.usedClasses, classPackages.totalClasses),
      ),
    )
    .orderBy(asc(classPackages.expiresAt))
    .all()[0]

  if (!pkg) {
    throw createError({ statusCode: 400, statusMessage: '该学员没有可用的课时包' })
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

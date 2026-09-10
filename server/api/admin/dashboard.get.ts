import { desc, eq } from 'drizzle-orm'
import { classPackages, students } from '~/server/db/schema'
import { LOW_REMAINING_THRESHOLD } from '~/server/utils/helpers'

export default defineEventHandler(async (event) => {
  const teacher = await requireTeacher(event)
  const db = useDb()

  const allStudents = db
    .select()
    .from(students)
    .where(eq(students.teacherId, teacher.id))
    .orderBy(desc(students.createdAt))
    .all()
  const allPackages = db.select().from(classPackages).all()
  const packagesByStudent = new Map<number, typeof allPackages>()
  for (const pkg of allPackages) {
    const list = packagesByStudent.get(pkg.studentId) || []
    list.push(pkg)
    packagesByStudent.set(pkg.studentId, list)
  }

  const now = Date.now()
  const rows = allStudents.map((s) => {
    const packages = packagesByStudent.get(s.id) || []
    const activePackages = packages
      .filter((p) => p.expiresAt.getTime() > now && p.usedClasses < p.totalClasses)
      .sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime())

    const activePackage = activePackages[0]
    const remaining = activePackage
      ? activePackage.totalClasses - activePackage.usedClasses
      : 0

    return {
      id: s.id,
      name: s.name,
      phone: s.phone,
      shareToken: s.shareToken,
      activePackage: activePackage
        ? {
            id: activePackage.id,
            totalClasses: activePackage.totalClasses,
            usedClasses: activePackage.usedClasses,
            remaining,
            expiresAt: activePackage.expiresAt.getTime(),
            isLow: remaining <= LOW_REMAINING_THRESHOLD,
            isExpired: activePackage.expiresAt.getTime() <= now,
          }
        : null,
      hasExpiredPackages: packages.some((p) => p.expiresAt.getTime() <= now && p.usedClasses < p.totalClasses),
    }
  })

  return { students: rows }
})

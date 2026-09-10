import { eq } from 'drizzle-orm'
import { classPackages, students } from '~/server/db/schema'
import { addMonths, generateShareToken, PACKAGE_OPTIONS } from '~/server/utils/helpers'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDb()
  const body = await readBody(event)
  const { name, phone, birthDate, notes, totalClasses } = body

  if (!name || !totalClasses) {
    throw createError({ statusCode: 400, statusMessage: 'Name and totalClasses are required' })
  }
  if (!PACKAGE_OPTIONS.includes(Number(totalClasses))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid package size' })
  }

  const shareToken = generateShareToken()
  const now = new Date()
  const expiresAt = addMonths(now, 12)

  const student = db
    .insert(students)
    .values({
      name: String(name),
      phone: phone ? String(phone) : null,
      birthDate: birthDate ? String(birthDate) : null,
      notes: notes ? String(notes) : null,
      shareToken,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get()

  const pkg = db
    .insert(classPackages)
    .values({
      studentId: student.id,
      totalClasses: Number(totalClasses),
      usedClasses: 0,
      expiresAt,
      createdAt: now,
    })
    .returning()
    .get()

  return { student, package: pkg }
})

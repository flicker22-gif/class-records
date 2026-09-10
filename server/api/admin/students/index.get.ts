import { desc, eq } from 'drizzle-orm'
import { students } from '~/server/db/schema'

export default defineEventHandler(async (event) => {
  const teacher = await requireTeacher(event)
  const db = useDb()
  const rows = db
    .select()
    .from(students)
    .where(eq(students.teacherId, teacher.id))
    .orderBy(desc(students.createdAt))
    .all()
  return { students: rows }
})

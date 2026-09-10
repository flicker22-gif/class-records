import { desc } from 'drizzle-orm'
import { students } from '~/server/db/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDb()
  const rows = db.select().from(students).orderBy(desc(students.createdAt)).all()
  return { students: rows }
})

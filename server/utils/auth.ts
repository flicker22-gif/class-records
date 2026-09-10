import bcrypt from 'bcryptjs'
import { createError, useSession, type H3Event } from 'h3'
import { eq } from 'drizzle-orm'
import { settings, teachers, type Teacher } from '~/server/db/schema'

interface SessionData {
  teacherId?: number
  admin?: boolean
}

// 默认老师账号（仅在 teachers 表为空时播种）
export const DEFAULT_TEACHERS = [
  { username: 'teacher1', displayName: '张老师', password: 'teacher123' },
  { username: 'teacher2', displayName: '李老师', password: 'teacher123' },
]

export async function initTeachers() {
  const db = useDb()

  const count = db.select().from(teachers).all().length
  if (count > 0) return

  // 兼容旧版本：如果之前设置过管理员密码，保留为「管理员」账号
  const legacy = db
    .select()
    .from(settings)
    .where(eq(settings.key, 'adminPasswordHash'))
    .get()

  const now = new Date()
  const seed: { username: string; displayName: string; passwordHash: string; createdAt: Date }[] = []

  if (legacy) {
    seed.push({
      username: 'admin',
      displayName: '管理员',
      passwordHash: legacy.value,
      createdAt: now,
    })
  }

  for (const t of DEFAULT_TEACHERS) {
    seed.push({
      username: t.username,
      displayName: t.displayName,
      passwordHash: bcrypt.hashSync(t.password, 10),
      createdAt: now,
    })
  }

  db.insert(teachers).values(seed).run()
}

function getSession(event: H3Event) {
  const config = useRuntimeConfig()
  return useSession<SessionData>(event, {
    password: String(config.sessionPassword),
  })
}

/** 要求已登录，返回当前登录老师；不存在则 401 */
export async function requireTeacher(event: H3Event): Promise<Teacher> {
  const session = await getSession(event)
  const teacherId = session.data.teacherId
  if (!teacherId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const db = useDb()
  const teacher = db.select().from(teachers).where(eq(teachers.id, teacherId)).get()
  if (!teacher) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return teacher
}

/** 旧接口名保留为别名，方便阅读 */
export async function requireAdmin(event: H3Event): Promise<Teacher> {
  return requireTeacher(event)
}

export function listTeachers() {
  const db = useDb()
  return db
    .select({
      id: teachers.id,
      username: teachers.username,
      displayName: teachers.displayName,
    })
    .from(teachers)
    .orderBy(teachers.id)
    .all()
}

export function verifyTeacherLogin(username: string, password: string): Teacher | null {
  const db = useDb()
  const teacher = db.select().from(teachers).where(eq(teachers.username, username)).get()
  if (!teacher) return null
  if (!bcrypt.compareSync(password, teacher.passwordHash)) return null
  return teacher
}

export async function createTeacherSession(event: H3Event, teacherId: number) {
  const session = await getSession(event)
  await session.update({ teacherId, admin: true })
}

export async function clearTeacherSession(event: H3Event) {
  const session = await getSession(event)
  await session.clear()
}

export async function getSessionTeacher(event: H3Event): Promise<Teacher | null> {
  const session = await getSession(event)
  if (!session.data.teacherId) return null
  const db = useDb()
  return (
    db.select().from(teachers).where(eq(teachers.id, session.data.teacherId)).get() ?? null
  )
}

export async function changeTeacherPassword(teacherId: number, password: string) {
  const db = useDb()
  const hash = bcrypt.hashSync(password, 10)
  db.update(teachers)
    .set({ passwordHash: hash })
    .where(eq(teachers.id, teacherId))
    .run()
}

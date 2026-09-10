import bcrypt from 'bcryptjs'
import { createError, useSession, type H3Event } from 'h3'
import { eq } from 'drizzle-orm'
import { settings } from '~/server/db/schema'

export async function initAdminPassword() {
  const config = useRuntimeConfig()
  const db = useDb()
  const plainPassword = String(config.adminPassword)

  const existing = db.select().from(settings).where(eq(settings.key, 'adminPasswordHash')).get()
  if (!existing) {
    const hash = bcrypt.hashSync(plainPassword, 10)
    db.insert(settings).values({ key: 'adminPasswordHash', value: hash }).run()
  }
}

export async function requireAdmin(event: H3Event) {
  const config = useRuntimeConfig()
  const session = await useSession<{ admin?: boolean }>(event, {
    password: String(config.sessionPassword),
  })
  if (!session.data.admin) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}

export async function verifyAdminPassword(password: string) {
  const db = useDb()
  const row = db.select().from(settings).where(eq(settings.key, 'adminPasswordHash')).get()
  if (!row) return false
  return bcrypt.compareSync(password, row.value)
}

export async function setAdminPassword(password: string) {
  const db = useDb()
  const hash = bcrypt.hashSync(password, 10)
  db.insert(settings)
    .values({ key: 'adminPasswordHash', value: hash })
    .onConflictDoUpdate({ target: settings.key, set: { value: hash } })
    .run()
}

export async function createAdminSession(event: H3Event) {
  const config = useRuntimeConfig()
  const session = await useSession<{ admin?: boolean }>(event, {
    password: String(config.sessionPassword),
  })
  await session.update({ admin: true })
}

export async function clearAdminSession(event: H3Event) {
  const config = useRuntimeConfig()
  const session = await useSession<{ admin?: boolean }>(event, {
    password: String(config.sessionPassword),
  })
  await session.clear()
}

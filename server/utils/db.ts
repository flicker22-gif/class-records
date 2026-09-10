import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from '~/server/db/schema'

let db: ReturnType<typeof drizzle<typeof schema>> | null = null

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

export function useDb() {
  if (db) return db

  const config = useRuntimeConfig()
  const dbPath = String(config.dbPath)
  ensureDir(path.dirname(dbPath))

  const sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')

  db = drizzle(sqlite, { schema })

  const migrationsFolder = process.env.MIGRATIONS_PATH
    ? path.resolve(process.env.MIGRATIONS_PATH)
    : process.dev
      ? path.join(process.cwd(), 'server/db/migrations')
      : path.join(process.cwd(), 'migrations')

  ensureDir(migrationsFolder)
  migrate(db, { migrationsFolder })

  return db
}

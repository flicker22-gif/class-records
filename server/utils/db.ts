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
  // 优先读取运行时环境变量：生产构建后 runtimeConfig 默认值已固化，
  // docker-compose 通过 DB_PATH 覆盖数据库位置时需要在此生效
  const dbPath = process.env.DB_PATH || String(config.dbPath)
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

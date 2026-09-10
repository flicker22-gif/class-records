import { relations, sql } from 'drizzle-orm'
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const teachers = sqliteTable(
  'teachers',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    username: text('username').notNull(),
    displayName: text('display_name').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    usernameIdx: uniqueIndex('teacher_username_idx').on(table.username),
  }),
)

export const teachersRelations = relations(teachers, ({ many }) => ({
  students: many(students),
}))

export const students = sqliteTable(
  'students',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    teacherId: integer('teacher_id')
      .notNull()
      .references(() => teachers.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    phone: text('phone'),
    birthDate: text('birth_date'),
    notes: text('notes'),
    shareToken: text('share_token').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    shareTokenIdx: uniqueIndex('share_token_idx').on(table.shareToken),
  }),
)

export const studentsRelations = relations(students, ({ one, many }) => ({
  teacher: one(teachers, { fields: [students.teacherId], references: [teachers.id] }),
  packages: many(classPackages),
  attendance: many(attendance),
}))

export const classPackages = sqliteTable('class_packages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studentId: integer('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  totalClasses: integer('total_classes').notNull(),
  usedClasses: integer('used_classes').notNull().default(0),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const classPackagesRelations = relations(classPackages, ({ one, many }) => ({
  student: one(students, { fields: [classPackages.studentId], references: [students.id] }),
  attendance: many(attendance),
}))

export const attendance = sqliteTable('attendance', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studentId: integer('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  packageId: integer('package_id')
    .notNull()
    .references(() => classPackages.id, { onDelete: 'cascade' }),
  classDate: text('class_date').notNull(),
  cancelledAt: integer('cancelled_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const attendanceRelations = relations(attendance, ({ one }) => ({
  student: one(students, { fields: [attendance.studentId], references: [students.id] }),
  package: one(classPackages, { fields: [attendance.packageId], references: [classPackages.id] }),
}))

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
})

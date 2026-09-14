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

export const smsNotifyTypes = ['low', 'expiring_30', 'expiring_7'] as const
export type SmsNotifyType = (typeof smsNotifyTypes)[number]
export const smsStatuses = ['sent', 'failed', 'logged'] as const
export type SmsStatus = (typeof smsStatuses)[number]

export const smsLogs = sqliteTable(
  'sms_log',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    studentId: integer('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    packageId: integer('package_id')
      .notNull()
      .references(() => classPackages.id, { onDelete: 'cascade' }),
    notifyType: text('notify_type').$type<SmsNotifyType>().notNull(),
    phone: text('phone').notNull(),
    content: text('content').notNull(),
    status: text('status').$type<SmsStatus>().notNull(),
    error: text('error'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    // 硬性去重：仅真实发送成功占坑；logged / failed 不阻塞将来真实发送与重试
    sentOnceIdx: uniqueIndex('sms_log_sent_once_idx')
      .on(table.packageId, table.notifyType)
      .where(sql`status = 'sent'`),
  }),
)

export const smsLogsRelations = relations(smsLogs, ({ one }) => ({
  student: one(students, { fields: [smsLogs.studentId], references: [students.id] }),
  package: one(classPackages, { fields: [smsLogs.packageId], references: [classPackages.id] }),
}))

import type { SmsNotifyType, SmsStatus } from '~/server/db/schema'

export type SmsMode = 'console' | 'aliyun'

export type SendStatus = Extract<SmsStatus, 'sent' | 'failed' | 'logged'>

export interface SendOutcome {
  status: SendStatus
  error?: string
  providerBizId?: string
}

export type SkipReason = 'already_sent' | 'no_phone' | 'invalid_phone' | 'scan_busy'

export interface ScanItem {
  studentId: number
  studentName: string
  packageId: number
  notifyType: SmsNotifyType
  phone: string | null
  content: string
  outcome: SendStatus | 'skipped'
  reason?: SkipReason
  error?: string
}

export interface ScanSummary {
  ranAt: number
  mode: SmsMode
  modeNote?: string
  counts: { sent: number; logged: number; failed: number; skipped: number }
  items: ScanItem[]
}

import type { SmsNotifyType } from '~/server/db/schema'
import type { SmsSettings } from './config'

export interface SmsContext {
  studentName: string
  remaining: number
  daysLeft: number
  expireDate: string // YYYY-MM-DD
}

export interface RenderedSms {
  templateCode: string
  /** 阿里云模板参数，JSON 字符串；变量名需与审批通过的模板一致 */
  templateParam: string
  /** 中文文案预览：用于 console 日志与 sms_log.content，真实内容以阿里云模板渲染为准 */
  text: string
}

export function renderSms(
  type: SmsNotifyType,
  ctx: SmsContext,
  settings: SmsSettings,
): RenderedSms {
  if (type === 'low') {
    return {
      templateCode: settings.templateLow,
      templateParam: JSON.stringify({
        name: ctx.studentName,
        remaining: ctx.remaining,
      }),
      text: `家长您好，${ctx.studentName}同学的课时仅剩${ctx.remaining}节，请及时安排续费。`,
    }
  }
  return {
    templateCode: settings.templateExpiring,
    templateParam: JSON.stringify({
      name: ctx.studentName,
      days: ctx.daysLeft,
      date: ctx.expireDate,
    }),
    text: `家长您好，${ctx.studentName}同学的课时包将于${ctx.daysLeft}天后（${ctx.expireDate}）到期，请及时安排上课或续费。`,
  }
}

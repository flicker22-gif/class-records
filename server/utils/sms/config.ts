import type { SmsMode } from './types'

export interface SmsSettings {
  provider: string
  accessKeyId: string
  accessKeySecret: string
  endpoint: string
  signName: string
  templateLow: string
  templateExpiring: string
}

export function getSmsSettings(): SmsSettings {
  const c = useRuntimeConfig()
  return {
    provider: String(c.smsProvider || 'console'),
    accessKeyId: String(c.smsAliyunAccessKeyId || ''),
    accessKeySecret: String(c.smsAliyunAccessKeySecret || ''),
    endpoint: String(c.smsAliyunEndpoint || 'dysmsapi.aliyuncs.com'),
    signName: String(c.smsSignName || ''),
    templateLow: String(c.smsTemplateLow || ''),
    templateExpiring: String(c.smsTemplateExpiring || ''),
  }
}

/**
 * 解析当前短信通道：
 * - 未显式选择 aliyun 时一律为 console 占位模式（仅写日志，不外呼）
 * - 选了 aliyun 但密钥/签名/模板缺项时，降级 console 并给出原因，避免静默漏发
 */
export function resolveSmsMode(): { mode: SmsMode; note?: string } {
  const s = getSmsSettings()
  if (s.provider !== 'aliyun') {
    return { mode: 'console' }
  }
  const complete =
    !!s.accessKeyId &&
    !!s.accessKeySecret &&
    !!s.signName &&
    !!s.templateLow &&
    !!s.templateExpiring
  if (complete) {
    return { mode: 'aliyun' }
  }
  return {
    mode: 'console',
    note: '已选择阿里云短信但配置不完整（AccessKey/签名/模板），当前降级为占位模式，短信仅写入服务器日志',
  }
}

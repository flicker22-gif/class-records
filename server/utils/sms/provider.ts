import { getSmsSettings, resolveSmsMode } from './config'
import type { RenderedSms } from './templates'
import type { SendOutcome } from './types'

// 阿里云客户端单例；console 模式下永不加载该 SDK
let clientPromise: Promise<any> | null = null

// 兼容两种 CJS 互操作：原生 Node ESM 下 Client 在 mod.default.default，
// Nitro/rollup 打包后 mod.default 即 Client 构造函数
function resolveClient(mod: any) {
  return mod?.default?.default ?? mod?.default
}

async function getAliyunClient(): Promise<any> {
  if (clientPromise) return clientPromise
  clientPromise = (async () => {
    // 必须使用字面量动态 import：占位模式不加载，同时构建时能被依赖追踪打包进产物
    const mod: any = await import('@alicloud/dysmsapi20170525')
    const Client = resolveClient(mod)
    const s = getSmsSettings()
    return new Client({
      accessKeyId: s.accessKeyId,
      accessKeySecret: s.accessKeySecret,
      endpoint: s.endpoint,
    })
  })()
  return clientPromise
}

export async function dispatchSms(phone: string, rendered: RenderedSms): Promise<SendOutcome> {
  const { mode } = resolveSmsMode()

  if (mode === 'console') {
    console.log(
      `[sms:console] -> ${phone} [${rendered.templateCode || 'no-template'}] ${rendered.text}`,
    )
    return { status: 'logged' }
  }

  try {
    const mod: any = await import('@alicloud/dysmsapi20170525')
    const client = await getAliyunClient()
    const SendSmsRequest = mod.SendSmsRequest ?? mod.default?.SendSmsRequest
    const s = getSmsSettings()
    const resp = await client.sendSms(
      new SendSmsRequest({
        phoneNumbers: phone,
        signName: s.signName,
        templateCode: rendered.templateCode,
        templateParam: rendered.templateParam,
      }),
    )
    if (resp.body?.code === 'OK') {
      return { status: 'sent', providerBizId: resp.body.bizId }
    }
    return {
      status: 'failed',
      error: `${resp.body?.code || 'UNKNOWN'}: ${resp.body?.message || ''}`.trim(),
    }
  } catch (e: any) {
    return { status: 'failed', error: e?.message || String(e) }
  }
}

import { runSmsScan } from '../utils/sms/scan'

const STARTUP_DELAY_MS = 30_000
const INTERVAL_MS = 24 * 60 * 60 * 1000

const g = globalThis as unknown as { __smsSchedulerInstalled?: boolean }

export default defineNitroPlugin(() => {
  // 防止 dev 环境 HMR 重复挂载定时器
  if (g.__smsSchedulerInstalled) return
  g.__smsSchedulerInstalled = true

  // 用 setTimeout 链而非 setInterval：避免扫描耗时长导致重叠/漂移；
  // 容器重启即有一次启动补偿扫描，因此不绑定钟点、不依赖容器时区
  let timer: NodeJS.Timeout
  const tick = async () => {
    try {
      await runSmsScan()
    } catch (e) {
      console.error('[sms] scheduled scan failed', e)
    } finally {
      timer = setTimeout(tick, INTERVAL_MS)
    }
  }
  timer = setTimeout(tick, STARTUP_DELAY_MS)
})

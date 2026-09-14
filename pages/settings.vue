<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'default' })

const { changePassword, logout } = useAuth()

const password = ref('')
const confirmPassword = ref('')
const message = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  message.value = ''
  error.value = ''
  if (password.value.length < 4) {
    error.value = '密码至少 4 位'
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = '两次输入不一致'
    return
  }
  loading.value = true
  try {
    await changePassword(password.value)
    message.value = '密码已修改，请重新登录'
    password.value = ''
    confirmPassword.value = ''
    setTimeout(() => logout(), 1500)
  } catch (e: any) {
    error.value = e?.data?.statusMessage || '修改失败'
  } finally {
    loading.value = false
  }
}

// ---------- 短信续费提醒 ----------
type NotifyType = 'low' | 'expiring_30' | 'expiring_7'
type SmsStatus = 'sent' | 'failed' | 'logged'

const TYPE_LABEL: Record<NotifyType, string> = {
  low: '低课时',
  expiring_30: '临期30天',
  expiring_7: '临期7天',
}
const STATUS_LABEL: Record<SmsStatus, string> = {
  sent: '已发送',
  failed: '发送失败',
  logged: '仅记录',
}

interface LogRow {
  id: number
  studentName: string | null
  notifyType: NotifyType
  phone: string
  content: string
  status: SmsStatus
  error: string | null
  createdAt: number
}
interface ScanItem {
  studentId: number
  studentName: string
  notifyType: NotifyType
  phone: string | null
  content: string
  outcome: SmsStatus | 'skipped'
  reason?: string
  error?: string
}

const { data: logsData, refresh: refreshLogs } = await useFetch<{
  channel: { mode: 'console' | 'aliyun'; note?: string; signName: string | null }
  logs: LogRow[]
}>('/api/admin/sms/logs')

const smsRunning = ref(false)
const scanSummary = ref<{
  mode: string
  counts: { sent: number; logged: number; failed: number; skipped: number }
  items: ScanItem[]
} | null>(null)
const smsError = ref('')

async function runSmsCheck() {
  smsRunning.value = true
  smsError.value = ''
  try {
    scanSummary.value = await $fetch('/api/admin/sms/run', { method: 'POST' })
    await refreshLogs()
  } catch (e: any) {
    smsError.value = e?.data?.statusMessage || '检查失败'
  } finally {
    smsRunning.value = false
  }
}

function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-lg font-bold">设置</h1>

    <div class="bg-white rounded-xl shadow p-4 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="font-medium text-gray-800">短信续费提醒</h2>
        <span
          v-if="logsData?.channel.mode === 'aliyun'"
          class="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700"
        >
          已接入阿里云短信<span v-if="logsData.channel.signName"> · 签名：{{ logsData.channel.signName }}</span>
        </span>
        <span
          v-else
          class="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700"
        >
          占位模式：仅写服务器日志，不会真实发送
        </span>
      </div>

      <p class="text-sm text-gray-500">
        每天自动扫描：剩余课时 ≤ 5 节、课时包到期前 30 天和 7 天，向学员登记的家长手机号发送续费提醒。
      </p>
      <p v-if="logsData?.channel.note" class="text-sm text-amber-700 bg-amber-50 rounded-lg p-2">
        {{ logsData.channel.note }}
      </p>

      <button
        type="button"
        :disabled="smsRunning"
        class="w-full bg-indigo-600 text-white rounded-lg py-2 font-medium disabled:opacity-50"
        @click="runSmsCheck"
      >
        {{ smsRunning ? '检查中...' : '立即检查并发送' }}
      </button>
      <p v-if="smsError" class="text-red-600 text-sm">{{ smsError }}</p>

      <div v-if="scanSummary" class="space-y-3">
        <div class="flex gap-2 text-sm">
          <span class="px-2 py-1 rounded-full bg-green-100 text-green-700">发送 {{ scanSummary.counts.sent }}</span>
          <span class="px-2 py-1 rounded-full bg-gray-100 text-gray-600">记录 {{ scanSummary.counts.logged }}</span>
          <span class="px-2 py-1 rounded-full bg-red-100 text-red-700">失败 {{ scanSummary.counts.failed }}</span>
          <span class="px-2 py-1 rounded-full bg-gray-100 text-gray-500">跳过 {{ scanSummary.counts.skipped }}</span>
        </div>
        <ul v-if="scanSummary.items.length" class="text-sm divide-y border rounded-lg">
          <li
            v-for="(item, i) in scanSummary.items"
            :key="i"
            class="py-2 px-3 flex justify-between gap-2"
          >
            <span class="min-w-0">
              <span v-if="item.studentName">{{ item.studentName }} · {{ TYPE_LABEL[item.notifyType] }}</span>
              <span v-else class="text-gray-400">
                {{ item.reason === 'scan_busy' ? '上一次扫描仍在进行中，本次跳过' : item.reason }}
              </span>
              <span v-if="item.phone" class="text-gray-400 ml-1">{{ item.phone }}</span>
              <span v-if="item.error" class="text-red-500 block text-xs truncate" :title="item.error">{{ item.error }}</span>
            </span>
            <span
              class="shrink-0 text-xs px-2 py-0.5 rounded-full h-fit"
              :class="{
                'bg-green-100 text-green-700': item.outcome === 'sent',
                'bg-gray-100 text-gray-500': item.outcome === 'logged' || item.outcome === 'skipped',
                'bg-red-100 text-red-700': item.outcome === 'failed',
              }"
            >
              {{ item.outcome === 'skipped' ? '跳过' : STATUS_LABEL[item.outcome] }}
            </span>
          </li>
        </ul>
      </div>

      <div class="border-t pt-3">
        <h3 class="text-sm font-medium text-gray-700 mb-2">最近发送记录</h3>
        <p v-if="!logsData?.logs?.length" class="text-sm text-gray-400">暂无记录。</p>
        <ul v-else class="text-sm divide-y border rounded-lg max-h-72 overflow-y-auto">
          <li v-for="log in logsData.logs" :key="log.id" class="py-2 px-3 space-y-0.5">
            <div class="flex justify-between gap-2">
              <span class="truncate">
                {{ log.studentName || '已删除学员' }} · {{ TYPE_LABEL[log.notifyType] }} · {{ log.phone }}
              </span>
              <span
                class="shrink-0 text-xs px-2 py-0.5 rounded-full h-fit"
                :class="{
                  'bg-green-100 text-green-700': log.status === 'sent',
                  'bg-gray-100 text-gray-500': log.status === 'logged',
                  'bg-red-100 text-red-700': log.status === 'failed',
                }"
              >
                {{ STATUS_LABEL[log.status] }}
              </span>
            </div>
            <div class="text-xs text-gray-400 flex justify-between gap-2">
              <span class="truncate" :title="log.error || log.content">{{ log.error || log.content }}</span>
              <span class="shrink-0">{{ formatDateTime(log.createdAt) }}</span>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <form @submit.prevent="submit" class="bg-white rounded-xl shadow p-4 space-y-4">
      <h2 class="font-medium text-gray-800">修改我的登录密码</h2>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">新密码</label>
        <input
          v-model="password"
          type="password"
          class="w-full rounded-lg border border-gray-300 px-3 py-2"
          required
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
        <input
          v-model="confirmPassword"
          type="password"
          class="w-full rounded-lg border border-gray-300 px-3 py-2"
          required
        />
      </div>

      <p v-if="message" class="text-green-600 text-sm">{{ message }}</p>
      <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>

      <button
        type="submit"
        :disabled="loading"
        class="w-full bg-indigo-600 text-white rounded-lg py-2 font-medium disabled:opacity-50"
      >
        {{ loading ? '保存中...' : '修改密码' }}
      </button>
    </form>
  </div>
</template>

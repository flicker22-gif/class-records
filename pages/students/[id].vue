<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'default' })

const route = useRoute()
const id = Number(route.params.id)
const origin = useRequestURL().origin

const { data, refresh, pending } = await useFetch(`/api/admin/students/${id}`, {
  headers: useRequestHeaders(['cookie']),
})

const parentUrl = computed(() => {
  if (!data.value?.student) return ''
  return `${origin}/p/${data.value.student.shareToken}`
})

const copied = ref(false)
function copyUrl() {
  navigator.clipboard.writeText(parentUrl.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

const undoBusy = ref<number | null>(null)
async function undo(recordId: number) {
  if (!confirm('确定撤销这次签到吗？课时将恢复。')) return
  undoBusy.value = recordId
  try {
    await $fetch(`/api/admin/attendance/${recordId}/undo`, { method: 'POST' })
    await refresh()
  } finally {
    undoBusy.value = null
  }
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('zh-CN')
}
</script>

<template>
  <div v-if="pending" class="text-gray-500">加载中...</div>
  <div v-else-if="!data?.student" class="text-gray-500">学员不存在。</div>
  <div v-else class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-lg font-bold">{{ data.student.name }}</h1>
      <NuxtLink
        :to="`/checkin`"
        class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm"
      >
        签到
      </NuxtLink>
    </div>

    <div class="bg-white rounded-xl shadow p-4 space-y-2 text-sm">
      <div v-if="data.student.phone"><span class="text-gray-500">家长手机：</span>{{ data.student.phone }}</div>
      <div v-if="data.student.birthDate"><span class="text-gray-500">出生日期：</span>{{ data.student.birthDate }}</div>
      <div v-if="data.student.notes"><span class="text-gray-500">备注：</span>{{ data.student.notes }}</div>
      <div class="pt-2 border-t">
        <div class="text-gray-500 mb-1">家长查询链接：</div>
        <div class="flex items-center gap-2">
          <input
            :value="parentUrl"
            readonly
            class="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-xs"
          />
          <button
            class="text-indigo-600 text-xs whitespace-nowrap"
            @click="copyUrl"
          >
            {{ copied ? '已复制' : '复制' }}
          </button>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow p-4">
      <h2 class="font-semibold mb-3">课时包</h2>
      <div v-if="data.packages.length === 0" class="text-gray-500">暂无课时包。</div>
      <div v-else class="space-y-2">
        <div
          v-for="pkg in data.packages"
          :key="pkg.id"
          class="flex items-center justify-between text-sm border-b last:border-0 py-2"
        >
          <div>
            {{ pkg.totalClasses }} 节课时包
            <span class="text-gray-500">（有效期至 {{ formatDate(pkg.expiresAt.getTime()) }}）</span>
          </div>
          <div
            class="font-medium"
            :class="pkg.usedClasses >= pkg.totalClasses ? 'text-gray-500' : pkg.totalClasses - pkg.usedClasses <= 5 ? 'text-red-600' : 'text-green-600'"
          >
            {{ pkg.totalClasses - pkg.usedClasses }} / {{ pkg.totalClasses }}
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow p-4">
      <h2 class="font-semibold mb-3">上课记录</h2>
      <div v-if="data.attendance.length === 0" class="text-gray-500">暂无记录。</div>
      <div v-else class="space-y-2">
        <div
          v-for="record in data.attendance"
          :key="record.id"
          class="flex items-center justify-between text-sm border-b last:border-0 py-2"
        >
          <div>
            <span>{{ record.classDate }}</span>
            <span v-if="record.cancelledAt" class="ml-2 text-gray-400">（已撤销）</span>
          </div>
          <button
            v-if="!record.cancelledAt"
            :disabled="undoBusy === record.id"
            class="text-red-600 text-xs disabled:opacity-50"
            @click="undo(record.id)"
          >
            撤销
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

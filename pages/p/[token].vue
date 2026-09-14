<script setup lang="ts">
definePageMeta({ layout: 'public' })

const route = useRoute()
const token = String(route.params.token)

const { data, pending, error } = await useFetch(`/api/public/students/${token}`)

const daysLeft = computed(() => {
  const pkg = data.value?.activePackage
  return pkg ? Math.max(0, Math.ceil((pkg.expiresAt - Date.now()) / 86400000)) : null
})

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('zh-CN')
}
</script>

<template>
  <div v-if="pending" class="text-center text-gray-500 py-12">加载中...</div>
  <div v-else-if="error" class="text-center text-gray-500 py-12">
    链接无效或学员不存在。
  </div>
  <div v-else class="space-y-4">
    <div class="text-center">
      <h1 class="text-2xl font-bold">{{ data.student.name }}</h1>
      <p class="text-gray-500">课时余额查询</p>
    </div>

    <div
      class="bg-white rounded-2xl shadow p-6 text-center border-4"
      :class="data.activePackage?.isLow ? 'border-red-200' : 'border-indigo-100'"
    >
      <div v-if="data.activePackage" class="space-y-2">
        <div
          class="text-5xl font-extrabold"
          :class="data.activePackage.isLow ? 'text-red-600' : 'text-indigo-600'"
        >
          {{ data.activePackage.remaining }}
        </div>
        <div class="text-gray-600">
          剩余课时 / 共 {{ data.activePackage.totalClasses }} 节
        </div>
        <div class="text-sm text-gray-500">
          有效期至 {{ formatDate(data.activePackage.expiresAt) }}
        </div>
        <div
          v-if="data.activePackage.isLow"
          class="mt-2 inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium"
        >
          课时不多，请及时续费
        </div>
        <div
          v-if="data.activePackage && daysLeft !== null && daysLeft <= 7"
          class="mt-2 ml-2 inline-block bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium"
        >
          将于 {{ daysLeft }} 天后到期
        </div>
      </div>
      <div v-else class="text-gray-500">
        当前没有可用的课时包。
      </div>
    </div>

    <div class="bg-white rounded-xl shadow p-4">
      <h2 class="font-semibold mb-3">上课记录</h2>
      <div v-if="data.history.length === 0" class="text-gray-500">暂无记录。</div>
      <div v-else class="divide-y">
        <div
          v-for="record in data.history"
          :key="record.id"
          class="py-2 text-sm flex justify-between"
        >
          <span>{{ record.classDate }}</span>
          <span class="text-gray-400 text-xs">{{ formatDate(record.createdAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

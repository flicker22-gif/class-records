<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'default' })

interface DashboardStudent {
  id: number
  name: string
  phone: string | null
  shareToken: string
  activePackage: {
    id: number
    totalClasses: number
    usedClasses: number
    remaining: number
    expiresAt: number
    isLow: boolean
    isExpired: boolean
  } | null
  hasExpiredPackages: boolean
}

const { data, refresh, pending } = await useFetch('/api/admin/dashboard', {
  headers: useRequestHeaders(['cookie']),
})

const students = computed(() => {
  const list = (data.value?.students || []) as DashboardStudent[]
  return [...list].sort((a, b) => {
    const ar = a.activePackage?.remaining ?? Infinity
    const br = b.activePackage?.remaining ?? Infinity
    return ar - br
  })
})

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('zh-CN')
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-lg font-bold">学员课时总览</h1>
      <NuxtLink
        to="/checkin"
        class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
      >
        去签到
      </NuxtLink>
    </div>

    <div v-if="pending" class="text-gray-500">加载中...</div>

    <div v-else-if="students.length === 0" class="text-gray-500 text-center py-12">
      还没有学员，先去新增一个吧。
    </div>

    <div v-else class="grid gap-3">
      <NuxtLink
        v-for="s in students"
        :key="s.id"
        :to="`/students/${s.id}`"
        class="block bg-white rounded-xl shadow p-4 border-l-4"
        :class="{
          'border-red-500': s.activePackage?.isLow,
          'border-gray-400': !s.activePackage || s.activePackage.isExpired,
          'border-green-500': s.activePackage && !s.activePackage.isLow && !s.activePackage.isExpired,
        }"
      >
        <div class="flex items-center justify-between">
          <div class="font-semibold text-lg">{{ s.name }}</div>
          <div
            v-if="s.activePackage"
            class="text-sm font-bold"
            :class="s.activePackage.isLow ? 'text-red-600' : 'text-gray-700'"
          >
            剩 {{ s.activePackage.remaining }} / {{ s.activePackage.totalClasses }} 节
          </div>
          <div v-else class="text-sm text-gray-500">无有效课时包</div>
        </div>
        <div class="mt-2 text-sm text-gray-600 flex items-center justify-between">
          <span v-if="s.activePackage">有效期至 {{ formatDate(s.activePackage.expiresAt) }}</span>
          <span v-else-if="s.hasExpiredPackages" class="text-orange-600">有已过期课时包</span>
          <span v-else>-</span>
          <span v-if="s.activePackage?.isLow" class="text-red-600 font-medium"></span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

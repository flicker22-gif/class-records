<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'default' })

const classDate = ref(today())
const { data, refresh, pending } = await useFetch('/api/admin/dashboard', {
  headers: useRequestHeaders(['cookie']),
})

const busy = ref<number | null>(null)
const message = ref('')
const error = ref('')

const students = computed(() => {
  const list = (data.value?.students || []) as any[]
  return list.filter((s) => s.activePackage && !s.activePackage.isExpired)
})

async function checkIn(studentId: number) {
  busy.value = studentId
  message.value = ''
  error.value = ''
  try {
    await $fetch('/api/admin/attendance', {
      method: 'POST',
      body: { studentId, classDate: classDate.value },
    })
    message.value = '签到成功'
    await refresh()
  } catch (e: any) {
    error.value = e?.data?.statusMessage || '签到失败'
  } finally {
    busy.value = null
  }
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-lg font-bold">上课签到</h1>

    <div class="bg-white rounded-xl shadow p-4">
      <label class="block text-sm font-medium text-gray-700 mb-1">上课日期</label>
      <input
        v-model="classDate"
        type="date"
        class="w-full rounded-lg border border-gray-300 px-3 py-2"
      />
    </div>

    <p v-if="message" class="text-green-600 text-sm">{{ message }}</p>
    <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>

    <div v-if="pending" class="text-gray-500">加载中...</div>
    <div v-else-if="students.length === 0" class="text-gray-500 text-center py-12">
      没有可签到的学员（无可用时课包）。
    </div>

    <div v-else class="grid gap-3">
      <div
        v-for="s in students"
        :key="s.id"
        class="bg-white rounded-xl shadow p-4 flex items-center justify-between"
      >
        <div>
          <div class="font-semibold">{{ s.name }}</div>
          <div class="text-sm text-gray-600">
            剩余 {{ s.activePackage.remaining }} / {{ s.activePackage.totalClasses }} 节
          </div>
        </div>
        <button
          :disabled="busy === s.id"
          class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          @click="checkIn(s.id)"
        >
          {{ busy === s.id ? '签到中...' : '签到' }}
        </button>
      </div>
    </div>
  </div>
</template>

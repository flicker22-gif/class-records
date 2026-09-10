<script setup lang="ts">
definePageMeta({ layout: 'default' })

interface TeacherOption {
  id: number
  username: string
  displayName: string
}

const { data: teachersData, pending: loadingTeachers } = await useFetch<{ teachers: TeacherOption[] }>(
  '/api/auth/teachers',
)
const teachers = computed(() => teachersData.value?.teachers ?? [])

const selectedUsername = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const { login, authenticated } = useAuth()

// 默认选中第一个账号
watchEffect(() => {
  if (!selectedUsername.value && teachers.value.length > 0) {
    selectedUsername.value = teachers.value[0].username
  }
})

watchEffect(() => {
  if (authenticated.value) {
    navigateTo('/dashboard')
  }
})

const selectedTeacher = computed(
  () => teachers.value.find((t) => t.username === selectedUsername.value) ?? null,
)

async function submit(username?: string) {
  const uname = username || selectedUsername.value
  if (!uname) return
  selectedUsername.value = uname
  error.value = ''
  if (!password.value) {
    error.value = '请输入密码'
    return
  }
  loading.value = true
  try {
    await login(uname, password.value)
    await navigateTo('/dashboard')
  } catch (e: any) {
    error.value = e?.data?.statusMessage || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-sm mx-auto mt-12 bg-white rounded-xl shadow p-6">
    <h1 class="text-xl font-bold text-center mb-6">课时管家后台登录</h1>

    <div v-if="loadingTeachers" class="text-center text-gray-500 py-8">加载账号中...</div>

    <form v-else @submit.prevent="submit()" class="space-y-5">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">选择老师账号</label>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="t in teachers"
            :key="t.id"
            type="button"
            class="rounded-lg border-2 px-3 py-3 text-sm font-medium transition-colors"
            :class="
              selectedUsername === t.username
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 text-gray-600 hover:border-indigo-300'
            "
            @click="selectedUsername = t.username"
          >
            {{ t.displayName }}
          </button>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          密码<span v-if="selectedTeacher" class="text-gray-400 font-normal">（{{ selectedTeacher.displayName }}）</span>
        </label>
        <input
          v-model="password"
          type="password"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="请输入该账号的密码"
          required
        />
      </div>

      <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>

      <button
        type="submit"
        :disabled="loading"
        class="w-full bg-indigo-600 text-white rounded-lg py-2 font-medium disabled:opacity-50"
      >
        {{ loading ? '登录中...' : '登录' }}
      </button>
    </form>
  </div>
</template>

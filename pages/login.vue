<script setup lang="ts">
definePageMeta({ layout: 'default' })

const password = ref('')
const error = ref('')
const loading = ref(false)
const { login, authenticated } = useAuth()

watchEffect(() => {
  if (authenticated.value) {
    navigateTo('/dashboard')
  }
})

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await login(password.value)
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
    <form @submit.prevent="submit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">管理密码</label>
        <input
          v-model="password"
          type="password"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="请输入密码"
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

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
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-lg font-bold">设置</h1>

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

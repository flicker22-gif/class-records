<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'default' })

const PACKAGE_OPTIONS = [20, 40, 60]

const form = reactive({
  name: '',
  phone: '',
  birthDate: '',
  notes: '',
  totalClasses: 40,
})

const loading = ref(false)
const error = ref('')

async function submit() {
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/admin/students', {
      method: 'POST',
      body: {
        name: form.name,
        phone: form.phone || null,
        birthDate: form.birthDate || null,
        notes: form.notes || null,
        totalClasses: Number(form.totalClasses),
      },
    })
    await navigateTo('/dashboard')
  } catch (e: any) {
    error.value = e?.data?.statusMessage || '创建失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-lg font-bold">新增学员</h1>

    <form @submit.prevent="submit" class="bg-white rounded-xl shadow p-4 space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
        <input
          v-model="form.name"
          type="text"
          required
          class="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">家长手机号</label>
        <input
          v-model="form.phone"
          type="tel"
          class="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">出生日期</label>
        <input
          v-model="form.birthDate"
          type="date"
          class="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
        <textarea
          v-model="form.notes"
          rows="2"
          class="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">课时包 *</label>
        <select
          v-model="form.totalClasses"
          class="w-full rounded-lg border border-gray-300 px-3 py-2"
        >
          <option v-for="n in PACKAGE_OPTIONS" :key="n" :value="n">{{ n }} 节（有效期 12 个月）</option>
        </select>
      </div>

      <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>

      <button
        type="submit"
        :disabled="loading"
        class="w-full bg-indigo-600 text-white rounded-lg py-2 font-medium disabled:opacity-50"
      >
        {{ loading ? '创建中...' : '创建学员' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
const { authenticated, logout } = useAuth()
const route = useRoute()

const nav = [
  { label: '总览', to: '/dashboard' },
  { label: '签到', to: '/checkin' },
  { label: '新增学员', to: '/students/new' },
  { label: '设置', to: '/settings' },
]
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm sticky top-0 z-10">
      <div class="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <NuxtLink to="/dashboard" class="font-bold text-lg text-indigo-600">
          课时管家
        </NuxtLink>
        <button
          v-if="authenticated"
          class="text-sm text-gray-600 hover:text-indigo-600"
          @click="logout"
        >
          退出
        </button>
      </div>
      <nav v-if="authenticated" class="max-w-3xl mx-auto px-4 pb-2 flex gap-4 overflow-x-auto">
        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          :class="[
            'text-sm whitespace-nowrap pb-1 border-b-2',
            route.path === item.to
              ? 'border-indigo-600 text-indigo-600 font-medium'
              : 'border-transparent text-gray-600 hover:text-gray-900',
          ]"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>
    </header>
    <main class="max-w-3xl mx-auto px-4 py-4">
      <slot />
    </main>
  </div>
</template>

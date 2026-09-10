interface TeacherInfo {
  id: number
  username: string
  displayName: string
}

interface MeResponse {
  authenticated: boolean
  teacher: TeacherInfo | null
}

export function useAuth() {
  const { data, refresh, pending } = useAsyncData(
    'auth-me',
    () =>
      $fetch<MeResponse>('/api/auth/me', {
        headers: useRequestHeaders(['cookie']),
      }),
    { server: true, default: () => ({ authenticated: false, teacher: null }) },
  )

  const authenticated = computed(() => data.value?.authenticated ?? false)
  const teacher = computed<TeacherInfo | null>(() => data.value?.teacher ?? null)

  async function login(username: string, password: string) {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    })
    await refresh()
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await refresh()
    await navigateTo('/login')
  }

  async function changePassword(password: string) {
    await $fetch('/api/admin/settings/password', {
      method: 'POST',
      body: { password },
    })
  }

  return {
    authenticated,
    teacher,
    loading: pending,
    login,
    logout,
    changePassword,
    refresh,
  }
}

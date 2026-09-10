export function useAuth() {
  const { data, refresh, pending } = useAsyncData(
    'auth-me',
    () => $fetch('/api/auth/me') as Promise<{ authenticated: boolean }>,
    { server: true, default: () => ({ authenticated: false }) },
  )

  const authenticated = computed(() => data.value?.authenticated ?? false)

  async function login(password: string) {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { password },
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
    loading: pending,
    login,
    logout,
    changePassword,
    refresh,
  }
}

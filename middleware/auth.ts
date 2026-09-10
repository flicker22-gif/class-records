export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return
  try {
    const data = await $fetch('/api/auth/me', {
      headers: useRequestHeaders(['cookie']),
    }) as { authenticated: boolean }
    if (!data.authenticated) {
      return navigateTo('/login')
    }
  } catch {
    return navigateTo('/login')
  }
})

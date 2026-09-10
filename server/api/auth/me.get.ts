export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const session = await useSession<{ admin?: boolean }>(event, {
    password: String(config.sessionPassword),
  })
  return { authenticated: !!session.data.admin }
})

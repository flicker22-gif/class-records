export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { password } = await readBody(event)
  if (!password || password.length < 4) {
    throw createError({ statusCode: 400, statusMessage: 'Password must be at least 4 characters' })
  }
  await setAdminPassword(password)
  return { ok: true }
})

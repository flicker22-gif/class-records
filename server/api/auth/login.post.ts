export default defineEventHandler(async (event) => {
  const { password } = await readBody(event)
  if (!password) {
    throw createError({ statusCode: 400, statusMessage: 'Password required' })
  }
  const ok = await verifyAdminPassword(password)
  if (!ok) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid password' })
  }
  await createAdminSession(event)
  return { ok: true }
})

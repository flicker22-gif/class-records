export default defineEventHandler(async (event) => {
  await clearAdminSession(event)
  return { ok: true }
})

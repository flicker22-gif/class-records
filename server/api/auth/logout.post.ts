export default defineEventHandler(async (event) => {
  await clearTeacherSession(event)
  return { ok: true }
})

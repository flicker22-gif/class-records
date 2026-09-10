export default defineEventHandler(async (event) => {
  const teacher = await requireTeacher(event)
  const { password } = await readBody(event)
  if (!password || password.length < 4) {
    throw createError({ statusCode: 400, statusMessage: '密码至少 4 位' })
  }
  await changeTeacherPassword(teacher.id, String(password))
  return { ok: true }
})

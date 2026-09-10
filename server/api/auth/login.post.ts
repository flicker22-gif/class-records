export default defineEventHandler(async (event) => {
  const { username, password } = await readBody(event)
  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: '请选择老师账号并输入密码' })
  }
  const teacher = verifyTeacherLogin(String(username), String(password))
  if (!teacher) {
    throw createError({ statusCode: 401, statusMessage: '账号或密码错误' })
  }
  await createTeacherSession(event, teacher.id)
  return {
    ok: true,
    teacher: { id: teacher.id, username: teacher.username, displayName: teacher.displayName },
  }
})

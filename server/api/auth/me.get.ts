export default defineEventHandler(async (event) => {
  const teacher = await getSessionTeacher(event)
  if (!teacher) {
    return { authenticated: false, teacher: null }
  }
  return {
    authenticated: true,
    teacher: { id: teacher.id, username: teacher.username, displayName: teacher.displayName },
  }
})

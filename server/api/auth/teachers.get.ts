export default defineEventHandler(async (event) => {
  return { teachers: listTeachers() }
})

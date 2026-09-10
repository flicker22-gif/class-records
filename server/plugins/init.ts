import { initTeachers } from '../utils/auth'

export default defineNitroPlugin(async () => {
  await initTeachers()
})

import { initAdminPassword } from '../utils/auth'

export default defineNitroPlugin(async () => {
  await initAdminPassword()
})

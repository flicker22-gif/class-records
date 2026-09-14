import { runSmsScan } from '~/server/utils/sms/scan'

export default defineEventHandler(async (event) => {
  await requireTeacher(event)
  return await runSmsScan()
})

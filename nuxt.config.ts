// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  runtimeConfig: {
    sessionPassword: process.env.NUXT_SESSION_PASSWORD || 'please-change-this-32-char-secret-key!',
    dbPath: process.env.DB_PATH || './data/class-records.db',
    // 短信通道：console=占位模式（仅写服务器日志，不外呼）；aliyun=阿里云短信
    smsProvider: process.env.NUXT_SMS_PROVIDER || 'console',
    smsAliyunAccessKeyId: process.env.NUXT_SMS_ALIYUN_ACCESS_KEY_ID || '',
    smsAliyunAccessKeySecret: process.env.NUXT_SMS_ALIYUN_ACCESS_KEY_SECRET || '',
    smsAliyunEndpoint: process.env.NUXT_SMS_ALIYUN_ENDPOINT || 'dysmsapi.aliyuncs.com',
    smsSignName: process.env.NUXT_SMS_SIGN_NAME || '',
    smsTemplateLow: process.env.NUXT_SMS_TEMPLATE_LOW || '',
    smsTemplateExpiring: process.env.NUXT_SMS_TEMPLATE_EXPIRING || '',
  },
})

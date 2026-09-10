// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  runtimeConfig: {
    sessionPassword: process.env.NUXT_SESSION_PASSWORD || 'please-change-this-32-char-secret-key!',
    dbPath: process.env.DB_PATH || './data/class-records.db',
  },
})

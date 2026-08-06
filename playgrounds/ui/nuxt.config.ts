export default defineNuxtConfig({
  modules: ['@movk/nuxt', '@movk/sigma'],
  components: [
    { path: '~/components/content/examples', pathPrefix: false, global: true },
    { path: '~/components' }
  ],
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2026-06-30',
  icon: {
    clientBundle: {
      scan: true
    }
  }
})

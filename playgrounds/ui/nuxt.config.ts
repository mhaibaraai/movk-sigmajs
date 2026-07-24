export default defineNuxtConfig({
  // @movk/nuxt 建在 @nuxt/ui 之上，用它而不是直接接 @nuxt/ui，
  // 是为了顺带演示两个 movk 库如何配合
  modules: ['@movk/nuxt', '@movk/sigma'],
  // 示例目录扁平注册，与 basic 一致：docs 的 component-example 模块按 pascalName 取源码
  components: [
    { path: '~/components/content/examples', pathPrefix: false, global: true },
    '~/components'
  ],
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  // @movk/nuxt 依赖 nuxt-auth-utils，它在每个请求上取会话，密钥为空会让整页 500。
  // 本 playground 不做任何鉴权，这里只是个开发占位值，不保护任何东西；
  // 真实项目一律用 NUXT_SESSION_PASSWORD 环境变量覆盖，见 .env.example
  runtimeConfig: {
    session: {
      password: process.env.NUXT_SESSION_PASSWORD || 'movk-sigma-playground-placeholder-32ch'
    }
  },
  compatibilityDate: 'latest'
})

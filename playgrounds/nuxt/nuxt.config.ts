import { fileURLToPath } from 'node:url'

// 数据层复用 docs：原始数据集与已下沉语义加工的接口，示例统一 useFetch('/api/xxx.json')
const dataDir = fileURLToPath(new URL('../../docs/public/data', import.meta.url))
const serverDir = fileURLToPath(new URL('../../docs/server', import.meta.url))

export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@movk/sigma'],
  components: [
    { path: '~/components/examples', pathPrefix: false },
    { path: '~/components' }
  ],
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2026-06-30',
  nitro: {
    scanDirs: [serverDir],
    publicAssets: [{ baseURL: '/data', dir: dataDir }]
  },
  icon: {
    clientBundle: {
      scan: true
    }
  },
  sigma: {
    settings: {
      gestureTarget: 'shared'
    }
  }
})

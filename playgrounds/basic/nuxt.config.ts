import { fileURLToPath } from 'node:url'

const examplesDir = fileURLToPath(new URL('../../docs/app/components/content/examples', import.meta.url))
const corpusDir = fileURLToPath(new URL('../../docs/app/utils', import.meta.url))
const examplesCss = fileURLToPath(new URL('../../docs/app/assets/css/main.css', import.meta.url))
const dataDir = fileURLToPath(new URL('../../docs/public/data', import.meta.url))

export default defineNuxtConfig({
  modules: ['@movk/sigma'],
  components: [
    { path: examplesDir, pathPrefix: false, global: true }
  ],
  imports: { dirs: [corpusDir] },
  devtools: { enabled: true },
  css: [examplesCss],
  alias: { '#examples': examplesDir },
  compatibilityDate: '2026-06-30',
  nitro: {
    publicAssets: [{ baseURL: '/data', dir: dataDir }]
  }
})

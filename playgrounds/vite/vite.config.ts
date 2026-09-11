import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import Sigma from '@movk/sigma/vite'
import { defineConfig } from 'vite'

/**
 * `dev:prepare` 用 `--stub` 产出的 dist 入口经 jiti 在运行时加载 TS 源，
 * 浏览器打包会把 jiti 一起拖进来，故浏览器侧一律指向源码。
 *
 * `vite.config.ts` 自身 import 的 `@movk/sigma/vite` 走 Node 侧 stub，
 * jiti 会转到 `src/vite.ts`，runtime 目录随之落在 `src/runtime`，无需 alias。
 */
const sourceAlias = {
  '@movk/sigma/vue': fileURLToPath(new URL('../../src/runtime/index.ts', import.meta.url)),
  '@movk/sigma/vue-plugin': fileURLToPath(new URL('../../src/vue-plugin.ts', import.meta.url)),
  '@movk/sigma/index.css': fileURLToPath(new URL('../../src/runtime/index.css', import.meta.url)),
  '#sigma': fileURLToPath(new URL('../../src/runtime', import.meta.url))
}

export default defineConfig({
  resolve: { alias: sourceAlias },
  plugins: [vue(), Sigma()]
})

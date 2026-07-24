import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

/**
 * `import.meta.dev` 与 `import.meta.client` 是 Nuxt 注入的，vitest 里取不到值：
 * 前者会让仅开发环境生效的告警成为测试覆盖不到的死代码，后者会让仅客户端执行的分支
 * 直接被跳过。Vite 的 `define` 不处理 `import.meta.*`，只能自己替换。
 * 测试跑在 happy-dom 里，两者都取 `true`。
 *
 * 不引 `vite` 的类型：它不是本仓库的直接依赖，为一个配置辅助函数加依赖不划算。
 */
function defineNuxtImportMeta() {
  return {
    name: 'movk-sigma:define-nuxt-import-meta',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      if (!id.includes('/src/runtime/') || !/import\.meta\.(?:dev|client)/.test(code)) {
        return null
      }
      return { code: code.replace(/import\.meta\.(dev|client)/g, 'true'), map: null }
    }
  }
}

export default defineConfig({
  plugins: [defineNuxtImportMeta(), vue()],
  test: {
    environment: 'happy-dom',
    include: ['test/**/*.test.ts'],
    setupFiles: ['test/setup/webgl-globals.ts']
  }
})

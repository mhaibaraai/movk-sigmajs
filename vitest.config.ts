import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

/**
 * `import.meta.dev` 是 Nuxt 注入的，vitest 里取不到值，几处仅在开发环境生效的告警
 * 就成了测试覆盖不到的死代码。Vite 的 `define` 不处理 `import.meta.*`，只能自己替换。
 *
 * 不引 `vite` 的类型：它不是本仓库的直接依赖，为一个配置辅助函数加依赖不划算。
 */
function defineImportMetaDev() {
  return {
    name: 'movk-sigma:define-import-meta-dev',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      if (!id.includes('/src/runtime/') || !code.includes('import.meta.dev')) {
        return null
      }
      return { code: code.replace(/import\.meta\.dev/g, 'true'), map: null }
    }
  }
}

export default defineConfig({
  plugins: [defineImportMetaDev(), vue()],
  test: {
    environment: 'happy-dom',
    include: ['test/**/*.test.ts'],
    setupFiles: ['test/setup/webgl-globals.ts']
  }
})

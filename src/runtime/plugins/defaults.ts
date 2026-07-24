import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import type { Settings } from 'sigma/settings'
import { setSigmaDefaults } from '../utils/global-settings'

/**
 * 把模块选项里的全局 `settings` 交接给 runtime。
 *
 * 之所以要绕这一道：`src/runtime/` 内不能依赖 `#app`，而模块选项在构建期、
 * 组件在运行期，中间需要一个只在 Nuxt 侧执行的搬运工。完整链路是
 * `module.ts` 写入 `runtimeConfig.public.sigma` → 本插件读出 → `global-settings`
 * 存为模块级变量 → 组件经 `getSigmaDefaults()` 取用。
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public.sigma as { settings?: Partial<Settings> } | undefined
  setSigmaDefaults(config?.settings ?? {})
})

import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import type { Settings } from 'sigma/settings'
import { setSigmaDefaults } from '../utils/global-settings'

/**
 * 把模块选项里的全局 `settings` 交接给 runtime：`module.ts` 写入
 * `runtimeConfig.public.sigma` → 本插件读出 → `global-settings` 存为模块级变量
 * → 组件经 `getSigmaDefaults()` 取用。
 *
 * 绕这一道是因为 `src/runtime/` 内不能依赖 `#app`。
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public.sigma as { settings?: Partial<Settings> } | undefined
  setSigmaDefaults(config?.settings ?? {})
})

import type { Plugin } from 'vue'
import { setSigmaConfig } from './runtime/config'
import type { SigmaRuntimeConfig } from './runtime/config'

export type * from './runtime/types/public'
export type { SigmaRuntimeConfig } from './runtime/config'

export type SigmaVuePluginOptions = Partial<SigmaRuntimeConfig>

/**
 * Vue 模式下注入全局默认 settings，对应 Nuxt 模块的 `sigma.settings` 选项。
 *
 * 只写配置、不做 `app.component` 全局注册：组件经自动导入或
 * `@movk/sigma/vue` 具名导入获得，保留 tree-shaking
 */
export const SigmaPlugin: Plugin<SigmaVuePluginOptions> = {
  install(_app, options = {}) {
    setSigmaConfig(options)
  }
}

export default SigmaPlugin

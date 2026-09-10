import type { Settings } from 'sigma/settings'

/**
 * 全局运行时配置。
 *
 * 以 `globalThis` + `Symbol.for` 持有：即使 Nuxt 与 Vue 两条入口各自打包一份本模块，
 * 也共享同一份状态，保证注入的配置对运行时组件可见。
 *
 * 只承载「全应用一致的静态默认」。SSR 下这份状态跨请求共享，不要往里放用户态数据。
 */
const STORE_KEY = Symbol.for('movk-sigma:config')

export interface SigmaRuntimeConfig {
  /**
   * 全局默认的 sigma 行为配置，与组件级 settings 深度合并后整体透传
   * @see https://v4.sigmajs.org/how-to/settings/
   */
  settings: Partial<Settings>
}

interface ConfigStore {
  config: SigmaRuntimeConfig
}

const globalScope = globalThis as typeof globalThis & { [STORE_KEY]?: ConfigStore }
const store: ConfigStore = (globalScope[STORE_KEY] ??= { config: { settings: {} } })

/** 写入全局配置，与已有值浅合并。由 Nuxt 插件与 Vue 插件分别调用 */
export function setSigmaConfig(value: Partial<SigmaRuntimeConfig>): void {
  store.config = { ...store.config, ...value }
}

/** 读取全局配置 */
export function getSigmaConfig(): SigmaRuntimeConfig {
  return store.config
}

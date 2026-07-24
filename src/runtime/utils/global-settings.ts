import type { Settings } from 'sigma/settings'

let defaults: Partial<Settings> = {}

/**
 * 写入模块级的默认渲染配置。由 Nuxt 插件在启动时调用，
 * 组件因此不必直接依赖 `#app`，日后补纯 Vue 入口时改喂一次即可。
 */
export function setSigmaDefaults(settings: Partial<Settings>): void {
  defaults = settings
}

/** 读取模块级的默认渲染配置 */
export function getSigmaDefaults(): Partial<Settings> {
  return defaults
}

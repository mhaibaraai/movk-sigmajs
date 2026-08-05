import type { Settings } from 'sigma/settings'

let defaults: Partial<Settings> = {}

/** 写入模块级的默认渲染配置，由 `plugins/defaults` 在启动时调用 */
export function setSigmaDefaults(settings: Partial<Settings>): void {
  defaults = settings
}

/** 读取模块级的默认渲染配置 */
export function getSigmaDefaults(): Partial<Settings> {
  return defaults
}

import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import type { Settings } from 'sigma/settings'
import { setSigmaConfig } from '../config'

/**
 * 把 `runtimeConfig.public.sigma` 写进运行时配置单例。
 *
 * 通用插件而非 client-only：服务端渲染 `SigmaGraph` 时也要读到同一份全局默认，
 * 避免首屏与客户端 hydration 后的 settings 不一致。
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public.sigma as { settings?: Partial<Settings> } | undefined

  if (config?.settings) {
    setSigmaConfig({ settings: config.settings })
  }
})

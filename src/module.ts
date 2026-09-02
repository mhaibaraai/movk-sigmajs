import { addComponentsDir, addImportsDir, createResolver, defineNuxtModule, extendViteConfig } from '@nuxt/kit'
import { defu } from 'defu'
import type { Settings } from 'sigma/settings'
import { name, version } from '../package.json'
import { createOptimizeDepResolver, resolveOptimizeDepsInclude } from './optimize-deps'

export type * from './runtime/types/public'

export interface ModuleOptions {
  /**
   * 组件名前缀。
   * @defaultValue 'Sigma'
   */
  prefix?: string
  /**
   * 全局默认的 sigma 行为配置，与组件级 settings 深度合并后整体透传。
   * 不做键白名单，sigma 新增的配置项无需本模块升级即可使用
   * @see https://v4.sigmajs.org/how-to/settings/
   */
  settings?: Partial<Settings>
  /**
   * 注入内置控件与覆盖层的样式表
   * @defaultValue true
   */
  css?: boolean
  /**
   * 把 sigma、graphology 与已安装的可选 peer 加进 Vite 预构建。
   * 关掉后需要自行在 nuxt.config 的 `vite.optimizeDeps.include` 里声明
   * @defaultValue true
   */
  optimizeDeps?: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: 'sigma',
    compatibility: { nuxt: '>=4.0.0' }
  },
  defaults: {
    prefix: 'Sigma',
    settings: {},
    css: true,
    optimizeDeps: true
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    nuxt.options.alias['#sigma'] = resolve('./runtime')

    if (options.css) {
      nuxt.options.css.unshift(resolve('./runtime/index.css'))
    }

    if (options.optimizeDeps) {
      const detected = resolveOptimizeDepsInclude(createOptimizeDepResolver(nuxt.options.rootDir))

      extendViteConfig((config) => {
        const existing = config.optimizeDeps?.include ?? []
        config.optimizeDeps = {
          ...config.optimizeDeps,
          include: [...existing, ...detected.filter(id => !existing.includes(id))]
        }
      })
    }

    const publicConfig = nuxt.options.runtimeConfig.public as Record<string, unknown>
    publicConfig.sigma = defu(publicConfig.sigma as Record<string, unknown> | undefined, {
      settings: options.settings
    })

    addComponentsDir({
      path: resolve('./runtime/components'),
      prefix: options.prefix,
      pathPrefix: false
    })

    addImportsDir(resolve('./runtime/composables'))
    addImportsDir(resolve('./runtime/utils'))
  }
})

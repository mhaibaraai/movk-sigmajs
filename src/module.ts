import { addImportsDir, createResolver, defineNuxtModule } from '@nuxt/kit'
import { defu } from 'defu'
import type { Settings } from 'sigma/settings'
import { name, version } from '../package.json'

export type * from './runtime/types'

export interface ModuleOptions {
  /**
   * 组件名前缀。组件文件本身不带前缀，由此选项统一加上
   * @defaultValue 'Sigma'
   */
  prefix?: string
  /**
   * 全局默认的 sigma 渲染配置，与组件级 settings 深度合并后整体透传。
   * 不做键白名单，sigma 新增的配置项无需本模块升级即可使用
   * @see https://www.sigmajs.org/docs/typedoc/sigma/src/settings/interfaces/Settings
   */
  settings?: Partial<Settings>
  /**
   * 注入内置控件与覆盖层的样式表
   * @defaultValue true
   */
  css?: boolean
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
    css: true
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    nuxt.options.alias['#sigma'] = resolve('./runtime')

    if (options.css) {
      nuxt.options.css.push(resolve('./runtime/index.css'))
    }

    const publicConfig = nuxt.options.runtimeConfig.public as Record<string, unknown>
    publicConfig.sigma = defu(publicConfig.sigma as Record<string, unknown> | undefined, {
      settings: options.settings
    })

    addImportsDir(resolve('./runtime/utils'))
  }
})

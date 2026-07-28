import { addComponentsDir, addImportsDir, addPlugin, createResolver, defineNuxtModule, extendViteConfig } from '@nuxt/kit'
import { defu } from 'defu'
import type { Settings } from 'sigma/settings'
import { name, version } from '../package.json'
import { createOptimizeDepResolver, resolveOptimizeDepsInclude } from './optimize-deps'

export type * from './runtime/types/public'

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

    // 给调用方一条稳定的深引用路径，免得写出 @movk/sigma/dist/runtime/... 这种会随构建产物变动的地址
    nuxt.options.alias['#sigma'] = resolve('./runtime')

    if (options.css) {
      nuxt.options.css.push(resolve('./runtime/index.css'))
    }

    // 模块装进消费方的 node_modules 后，Vite 扫不到 runtime 里对 graphology / sigma 系列的
    // import，浏览器会拿到未预构建的 CJS。这里替消费方补上声明，只探测得到的包才进清单，
    // 免得未装的可选 peer 换来一串 Vite 告警
    if (options.optimizeDeps) {
      const detected = resolveOptimizeDepsInclude(createOptimizeDepResolver(nuxt.options.rootDir))

      // 不传 client / server：那两个选项在 Nuxt 4.5 已废弃并会打印告警，
      // 且 Nuxt 5 的 Vite Environment API 本就让两端共享一份配置
      extendViteConfig((config) => {
        const existing = config.optimizeDeps?.include ?? []
        config.optimizeDeps = {
          ...config.optimizeDeps,
          include: [...existing, ...detected.filter(id => !existing.includes(id))]
        }
      })
    }

    // 全局 settings 经 runtimeConfig 下发，由 plugins/defaults 搬进 runtime 的模块级变量。
    // 绕这一道是因为 src/runtime/ 内不能依赖 #app，详见该插件的注释。
    // defu 而非直接赋值：调用方可能已在 nuxt.config 的 runtimeConfig 里写过同名键
    const publicConfig = nuxt.options.runtimeConfig.public as Record<string, unknown>
    publicConfig.sigma = defu(publicConfig.sigma as Record<string, unknown> | undefined, {
      settings: options.settings
    })

    // 组件文件名不带前缀，前缀由此统一加上；pathPrefix 关掉，目录层级不参与命名，
    // 于是 controls/ZoomControl.vue 注册为 SigmaZoomControl 而非 SigmaControlsZoomControl
    addComponentsDir({
      path: resolve('./runtime/components'),
      prefix: options.prefix,
      pathPrefix: false
    })

    addImportsDir(resolve('./runtime/composables'))
    // 工具函数一并自动导入：applyGraphDiff、curveParallelEdges 这些是调用方直接会用的公开 API
    addImportsDir(resolve('./runtime/utils'))
    addPlugin(resolve('./runtime/plugins/defaults'))
  }
})

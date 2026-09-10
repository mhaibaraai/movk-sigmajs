import type { Plugin } from 'vite'
import { createOptimizeDepResolver, resolveOptimizeDepsInclude } from './optimize-deps'
import { createSigmaUnplugin } from './unplugin'
import type { SigmaUnpluginOptions } from './unplugin'

export type { SigmaResolverOptions, SigmaUnpluginOptions } from './unplugin'
export { sigmaAutoImportDirs, sigmaComponentResolver } from './unplugin'

export interface SigmaViteOptions extends SigmaUnpluginOptions {
  /**
   * 把 sigma、graphology 与已安装的可选 peer 加进 Vite 预构建。
   * 关掉后需要自行在 `optimizeDeps.include` 里声明
   * @defaultValue true
   */
  optimizeDeps?: boolean
}

/** 探测项目里已安装的 sigma 相关依赖，产出可直接写进 `optimizeDeps.include` 的列表 */
export function sigmaOptimizeDepsInclude(root: string = process.cwd()): string[] {
  return resolveOptimizeDepsInclude(createOptimizeDepResolver(root))
}

/** 预构建子插件，与 Nuxt 模块里的 extendViteConfig 分支同源，不依赖 unplugin 三件套 */
function optimizeDepsPlugin(): Plugin {
  return {
    name: 'movk-sigma:optimize-deps',
    config(config) {
      const existing = config.optimizeDeps?.include ?? []
      const detected = sigmaOptimizeDepsInclude(config.root)

      return {
        optimizeDeps: {
          include: [...existing, ...detected.filter(id => !existing.includes(id))]
        }
      }
    }
  }
}

/**
 * Vue + Vite 项目的一站式插件：`Sigma*` 组件与 composables/utils 自动导入，
 * 外加 sigma 相关依赖的预构建声明。
 *
 * 与 `@nuxt/ui` 这类内置唯一 unplugin 实例的库同用时，改注入
 * `sigmaComponentResolver` / `sigmaAutoImportDirs` 复用宿主实例，不要再叠加本插件
 */
export default async function Sigma(options: SigmaViteOptions = {}): Promise<Plugin[]> {
  const unplugin = await createSigmaUnplugin()
  const plugins = [unplugin.vite(options)].flat() as Plugin[]

  if (options.optimizeDeps !== false) {
    plugins.push(optimizeDepsPlugin())
  }

  return plugins
}

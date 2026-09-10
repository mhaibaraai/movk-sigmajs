import { readdirSync } from 'node:fs'
import { join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { UnpluginInstance, UnpluginOptions } from 'unplugin'

export interface SigmaResolverOptions {
  /**
   * 组件前缀，与 Nuxt 模块的 `prefix` 选项对应
   * @defaultValue 'Sigma'
   */
  prefix?: string
}

export interface SigmaUnpluginOptions extends SigmaResolverOptions {
  /**
   * 生成 components.d.ts 与 auto-imports.d.ts
   * @defaultValue true
   */
  dts?: boolean
}

// runtime 目录：dev 经 --stub 的 jiti 解析到 src/runtime，发布时为 dist/runtime
const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))

/** 递归收集 runtime/components 下的 .vue：裸文件名（全局唯一）→ 绝对路径 */
function componentMap(): Map<string, string> {
  const dir = join(runtimeDir, 'components')
  const map = new Map<string, string>()

  for (const file of readdirSync(dir, { recursive: true }) as string[]) {
    if (!file.endsWith('.vue')) {
      continue
    }
    map.set(file.slice(file.lastIndexOf(sep) + 1, -'.vue'.length), join(dir, file))
  }

  return map
}

/**
 * `Sigma*` 组件解析器，可注入既有的 unplugin-vue-components 实例复用。
 * 子目录不进组件名，与 Nuxt 侧 `addComponentsDir({ pathPrefix: false })` 对齐
 */
export function sigmaComponentResolver(options: SigmaResolverOptions = {}) {
  const prefix = options.prefix ?? 'Sigma'
  const map = componentMap()

  return {
    type: 'component' as const,
    resolve: (name: string) => {
      if (!name.startsWith(prefix)) {
        return
      }
      const from = map.get(name.slice(prefix.length))
      return from ? { name: 'default', from } : undefined
    }
  }
}

/**
 * composables 与 utils 目录，交给 unimport 扫描真实导出，可注入既有的
 * unplugin-auto-import 实例复用。与 Nuxt 侧的两次 `addImportsDir` 对齐
 */
export function sigmaAutoImportDirs(): string[] {
  return [join(runtimeDir, 'composables'), join(runtimeDir, 'utils')]
}

/** unplugin 三件套是可选 peer，缺失时给出带包名的安装指引，而不是让消费方直面 ERR_MODULE_NOT_FOUND */
async function loadOptionalPeer<T>(id: string): Promise<T> {
  try {
    return await import(/* @vite-ignore */ id) as T
  }
  catch {
    throw new Error(`[@movk/sigma] 使用 @movk/sigma/vite 需要安装可选依赖 ${id}，请执行 pnpm add -D ${id}`)
  }
}

/**
 * 组装本库的 unplugin 实例：`Sigma*` 组件解析 + composables/utils 自动导入。
 *
 * 三件套动态加载，故返回 Promise；选项传给返回值上的 `vite` / `webpack` 等工厂
 */
export async function createSigmaUnplugin(): Promise<UnpluginInstance<SigmaUnpluginOptions | undefined>> {
  const { createUnplugin } = await loadOptionalPeer<typeof import('unplugin')>('unplugin')
  const Components = (await loadOptionalPeer<typeof import('unplugin-vue-components')>('unplugin-vue-components')).default
  const AutoImport = (await loadOptionalPeer<typeof import('unplugin-auto-import')>('unplugin-auto-import')).default

  return createUnplugin<SigmaUnpluginOptions | undefined>((options = {}, meta) => {
    const dts = options.dts ?? true

    // unplugin-vue-components 与 unplugin-auto-import 内部依赖不同大版本的 unplugin，
    // meta 类型互不兼容；用各自 raw 的形参类型做局部适配（运行时结构一致）
    const components = Components.raw({
      dts,
      resolvers: [sigmaComponentResolver(options)]
    }, meta as Parameters<typeof Components.raw>[1])

    const autoImport = AutoImport.raw({
      dts,
      dirs: sigmaAutoImportDirs()
    }, meta as Parameters<typeof AutoImport.raw>[1])

    return [components, autoImport].flat() as UnpluginOptions[]
  })
}

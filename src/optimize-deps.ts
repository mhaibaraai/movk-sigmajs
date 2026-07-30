import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { basename, dirname, isAbsolute, join } from 'node:path'

/**
 * Vite 预构建候选条目。
 *
 * 模块装进消费方的 node_modules 后，Vite 的依赖扫描不进 node_modules 里的源码，
 * runtime 对 graphology / sigma 系列的静态与动态 import 都不会被预构建，
 * 浏览器直接拿到 CJS 或裸 ESM，报缺少命名导出。这份清单替消费方补上声明
 */
export interface OptimizeDepCandidate {
  /** Vite `optimizeDeps.include` 的条目 id */
  id: string
  /** 传递依赖的宿主包。给定时从宿主的位置解析 id，并产出 `parent > id` 形式的条目 */
  parent?: string
}

/** 探测候选条目是否真的装得到，实现见 {@link createOptimizeDepResolver} */
export interface OptimizeDepResolver {
  /** id 能否解析成 Vite 可预构建的入口，fromDir 给定时以该目录为解析基准 */
  canResolve: (id: string, fromDir?: string) => boolean
  /** 包的解析基准目录，拿不到返回 null */
  packageBase: (id: string) => string | null
}

/**
 * 候选条目来自 `src/runtime/` 里的实际 import 与 package.json 的 peer 清单。
 * runtime 新增对某个包的 import 时，这里要同步补一条
 */
export const OPTIMIZE_DEPS_CANDIDATES: OptimizeDepCandidate[] = [
  // 必需 peer：graphology 被 Graph.vue 静态 import，sigma 两条在 onMounted 里动态 import
  { id: 'graphology' },
  { id: 'sigma' },
  { id: 'sigma/settings' },

  // 布局：useSigmaLayout 按名称动态 import，worker 子路径对应 worker: true 的监督模式
  { id: 'graphology-layout' },
  { id: 'graphology-layout-forceatlas2' },
  { id: 'graphology-layout-forceatlas2/worker' },
  { id: 'graphology-layout-noverlap' },
  { id: 'graphology-layout-noverlap/worker' },

  // 分析：useSigmaMetrics 按指标名取深层入口，社区划分单独一个包
  { id: 'graphology-metrics/centrality/betweenness' },
  { id: 'graphology-metrics/centrality/closeness' },
  { id: 'graphology-communities-louvain' },

  // sigma 生态：前三个由库内动态 import，渲染程序由使用方经 defineSigmaProgram 延迟加载
  { id: '@sigma/edge-curve' },
  { id: '@sigma/export-image' },
  { id: '@sigma/utils' },
  { id: '@sigma/node-image' },
  { id: '@sigma/node-border' },
  { id: '@sigma/node-square' },
  { id: '@sigma/node-piechart' },

  // 传递依赖：events 是 graphology 的 dependency，graphology-utils 是布局包的 dependency。
  // 严格 pnpm 下消费方根部都解析不到，只能用 Vite 的 `parent > child` 语法从宿主位置解析
  { id: 'events', parent: 'graphology' },
  { id: 'graphology-utils/is-graph', parent: 'graphology-layout' },
  { id: 'graphology-utils/defaults', parent: 'graphology-layout' },
  { id: 'graphology-utils/is-graph', parent: 'graphology-layout-forceatlas2' },
  { id: 'graphology-utils/getters', parent: 'graphology-layout-forceatlas2' }
]

/** 与 Vite 的 `isOptimizable` 对齐：解析结果不是这些扩展名，Vite 会警告 Cannot optimize dependency */
const OPTIMIZABLE_ENTRY_RE = /\.[cm]?[jt]s$/

/**
 * 包本体是否挂在基准目录的 node_modules 链上。
 *
 * `require.resolve` 会认 NODE_PATH，而 pnpm 跑脚本时正好把 .pnpm 的 hoist 目录塞进去，
 * 里面躺着一堆没链到项目根的包（装过又移除的依赖尤其常见）。Vite 的解析器不认 NODE_PATH，
 * 只看解析成不成功会把这些包放进 include，换来逐条 `Failed to resolve dependency`。
 * 沿链自己走一遍，才和 Vite 的查找范围对齐
 */
function isLinkedFrom(baseDir: string, id: string): boolean {
  const name = id.split('/').slice(0, id.startsWith('@') ? 2 : 1).join('/')

  for (let dir = baseDir; ;) {
    // 链上不含 node_modules/node_modules，与 Node 的查找顺序一致
    if (basename(dir) !== 'node_modules' && existsSync(join(dir, 'node_modules', name))) {
      return true
    }

    const parent = dirname(dir)
    if (parent === dir) {
      return false
    }

    dir = parent
  }
}

function tryResolve(resolve: NodeRequire['resolve'], id: string): string | null {
  try {
    const resolved = resolve(id)
    // Node 内置模块名会原样返回，不是路径就不算解析到了真实的包
    return isAbsolute(resolved) ? resolved : null
  }
  catch {
    return null
  }
}

/**
 * 以消费方项目根为基准的探测器。
 *
 * 未安装的可选 peer 必须在进 `optimizeDeps.include` 之前就被筛掉：Vite 对解析不到的
 * include 条目会逐条 warn，而嵌套条目在宿主缺失时更隐蔽——它的 `nestedResolveBasedir()`
 * 会静默退回项目根再解析一次，于是稳定产出一条告警。所以嵌套条目两段都探
 *
 * 只认项目根这一个基准，是为了与 Vite 自己的解析起点保持一致：从别处（如某个层自带的
 * node_modules、或 NODE_PATH）能解析到、Vite 却解析不到的包，探测通过反而换来一条告警。
 * 后者由 {@link isLinkedFrom} 挡掉
 *
 * @param rootDir 消费方项目根目录
 */
export function createOptimizeDepResolver(rootDir: string): OptimizeDepResolver {
  // createRequire 只取路径的目录部分作基准，文件本身不必存在
  const resolveFromRoot = createRequire(join(rootDir, 'package.json')).resolve

  return {
    canResolve(id, fromDir) {
      if (!isLinkedFrom(fromDir ?? rootDir, id)) {
        return false
      }

      const resolve = fromDir ? createRequire(join(fromDir, 'package.json')).resolve : resolveFromRoot
      const entry = tryResolve(resolve, id)
      if (entry) {
        return OPTIMIZABLE_ENTRY_RE.test(entry)
      }

      // events 这类与 Node 内置同名的包，require.resolve 拿到的是内置模块名，
      // 只能改探 package.json 才能确认真身装在 node_modules 里
      return tryResolve(resolve, `${id}/package.json`) !== null
    },

    packageBase(id) {
      if (!isLinkedFrom(rootDir, id)) {
        return null
      }

      const manifest = tryResolve(resolveFromRoot, `${id}/package.json`)
      if (manifest) {
        return dirname(manifest)
      }

      // graphology 这类 exports 没开放 ./package.json 的包退而求其次用入口所在目录：
      // 它同样在宿主的 node_modules 链上，沿链向上能找到宿主的传递依赖
      const entry = tryResolve(resolveFromRoot, id)
      return entry ? dirname(entry) : null
    }
  }
}

/**
 * 探测候选条目并产出 `optimizeDeps.include` 清单，未安装的一律静默跳过
 *
 * @param resolver 探测器，见 {@link createOptimizeDepResolver}
 * @param candidates 候选条目
 * @defaultValue `OPTIMIZE_DEPS_CANDIDATES`
 */
export function resolveOptimizeDepsInclude(
  resolver: OptimizeDepResolver,
  candidates: OptimizeDepCandidate[] = OPTIMIZE_DEPS_CANDIDATES
): string[] {
  const include: string[] = []

  for (const { id, parent } of candidates) {
    if (!parent) {
      if (resolver.canResolve(id) && !include.includes(id)) {
        include.push(id)
      }
      continue
    }

    const base = resolver.packageBase(parent)
    if (!base || !resolver.canResolve(id, base)) {
      continue
    }

    const nested = `${parent} > ${id}`
    if (!include.includes(nested)) {
      include.push(nested)
    }
  }

  return include
}

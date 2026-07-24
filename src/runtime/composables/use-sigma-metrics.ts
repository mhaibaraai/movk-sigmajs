import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import { useSigma } from './use-sigma'
import { useSigmaGraph } from './use-sigma-graph'

/** 中心性算法，degree 走核心 graphology，其余来自可选的 graphology-metrics */
export type SigmaCentralityKind = 'degree' | 'betweenness' | 'closeness'

export interface UseSigmaMetricsReturn {
  /** 各节点的度数，随图变更重算 */
  degrees: ComputedRef<Record<string, number>>
  /** 最大度数，度数映射到尺寸时作分母 */
  maxDegree: ComputedRef<number>
  /** 中心性，按图版本缓存，同一版本重复调用不重算 */
  centrality: (kind?: SigmaCentralityKind) => Promise<Record<string, number>>
  /** Louvain 社区划分，返回节点到社区编号的映射，同样按版本缓存 */
  communities: () => Promise<Record<string, number>>
}

/**
 * 图的度数、中心性与社区划分。
 *
 * 度数直接用核心 graphology 算，不引入额外依赖；中心性与社区依赖可选 peer，
 * 用到时才动态导入。两者都是 O(n·m) 量级的开销，按图版本缓存避免重复计算。
 */
export function useSigmaMetrics(): UseSigmaMetricsReturn {
  const { graph } = useSigma()
  const { version } = useSigmaGraph()

  const degrees = computed(() => {
    void version.value
    const result: Record<string, number> = {}
    graph.value.forEachNode((node) => {
      result[node] = graph.value.degree(node)
    })
    return result
  })

  const maxDegree = computed(() => {
    const values = Object.values(degrees.value)
    return values.length === 0 ? 0 : Math.max(...values)
  })

  const cache = new Map<string, Record<string, number>>()

  function cacheKey(kind: string) {
    return `${kind}@${version.value}`
  }

  function missing(pkg: string): never {
    throw new Error(`[@movk/sigma] 该指标需要可选依赖 ${pkg}，请先安装：pnpm add ${pkg}`)
  }

  return {
    degrees,
    maxDegree,

    async centrality(kind = 'degree') {
      if (kind === 'degree') {
        return degrees.value
      }

      const key = cacheKey(kind)
      const cached = cache.get(key)
      if (cached) {
        return cached
      }

      const module = kind === 'betweenness'
        ? await import('graphology-metrics/centrality/betweenness').catch(() => missing('graphology-metrics'))
        : await import('graphology-metrics/centrality/closeness').catch(() => missing('graphology-metrics'))

      const result = module.default(graph.value) as Record<string, number>
      cache.set(key, result)
      return result
    },

    async communities() {
      const key = cacheKey('louvain')
      const cached = cache.get(key)
      if (cached) {
        return cached
      }

      const module = await import('graphology-communities-louvain').catch(() => missing('graphology-communities-louvain'))
      const result = module.default(graph.value) as Record<string, number>
      cache.set(key, result)
      return result
    }
  }
}

import { computed, shallowRef } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type Graph from 'graphology'
import type { SerializedGraph } from 'graphology-types'
import { useSigma } from './use-sigma'
import { applyGraphDiff } from '../utils/apply-graph-diff'

export interface UseSigmaNeighborhoodOptions {
  /**
   * 默认邻域深度
   * @defaultValue 1
   */
  depth?: number
}

export interface UseSigmaNeighborhoodReturn {
  /** 已成功展开过的节点 */
  expanded: ComputedRef<ReadonlySet<string>>
  /** 是否正在拉取远端邻域 */
  isExpanding: Readonly<Ref<boolean>>
  /** 求某节点的 N 度邻域节点集合，含节点自身 */
  neighborhood: (key: string, depth?: number) => Set<string>
  /** 求某节点 N 度邻域内的边集合 */
  neighborhoodEdges: (key: string, depth?: number) => Set<string>
  /** 拉取远端邻域并增量合入当前图，已有节点的坐标不受影响 */
  expand: (key: string, loader: (key: string) => Promise<SerializedGraph>) => Promise<void>
  /** 清空展开记录 */
  reset: () => void
}

/**
 * 以某节点为中心逐层扩散的邻域计算，以及「点击展开」的增量合入。
 *
 * BFS 走 graphology 的 `neighbors()`，它在有向图上同时返回出入两侧的邻居，
 * 正是图谱浏览需要的可达性语义。
 */
export function useSigmaNeighborhood(options: UseSigmaNeighborhoodOptions = {}): UseSigmaNeighborhoodReturn {
  const { depth: defaultDepth = 1 } = options
  const { graph } = useSigma()

  const expandedKeys = shallowRef<ReadonlySet<string>>(new Set())
  const isExpanding = shallowRef(false)

  function bfs(instance: Graph, key: string, depth: number): Set<string> {
    const visited = new Set<string>([key])

    if (!instance.hasNode(key)) {
      return new Set()
    }

    let frontier = [key]

    for (let level = 0; level < depth; level++) {
      const next: string[] = []

      for (const current of frontier) {
        for (const neighbor of instance.neighbors(current)) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor)
            next.push(neighbor)
          }
        }
      }

      if (next.length === 0) {
        break
      }
      frontier = next
    }

    return visited
  }

  function neighborhood(key: string, depth = defaultDepth): Set<string> {
    return bfs(graph.value, key, depth)
  }

  function neighborhoodEdges(key: string, depth = defaultDepth): Set<string> {
    const nodes = neighborhood(key, depth)
    const edges = new Set<string>()

    for (const node of nodes) {
      for (const edge of graph.value.edges(node)) {
        const [source, target] = graph.value.extremities(edge)
        if (nodes.has(source) && nodes.has(target)) {
          edges.add(edge)
        }
      }
    }

    return edges
  }

  return {
    expanded: computed(() => expandedKeys.value),
    isExpanding,

    neighborhood,
    neighborhoodEdges,

    async expand(key, loader) {
      isExpanding.value = true
      try {
        const incoming = await loader(key)
        // prune 关闭即为增量合入：只添不删，已有节点的坐标沿用
        applyGraphDiff(graph.value, incoming, { prune: false })
        expandedKeys.value = new Set([...expandedKeys.value, key])
      }
      finally {
        isExpanding.value = false
      }
    },

    reset() {
      expandedKeys.value = new Set()
    }
  }
}

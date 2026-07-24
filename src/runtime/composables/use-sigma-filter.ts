import { computed, shallowRef, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { Attributes } from 'graphology-types'
import type { EdgeDisplayData, NodeDisplayData } from 'sigma/types'
import { useSigma } from './use-sigma'
import { useSigmaGraph } from './use-sigma-graph'
import { useSigmaReducer } from './use-sigma-reducer'

/** 返回 true 表示保留，false 表示隐藏 */
export type SigmaNodePredicate = (key: string, attributes: Attributes) => boolean
export type SigmaEdgePredicate = (key: string, attributes: Attributes) => boolean

export interface UseSigmaFilterOptions {
  /**
   * reducer 链内次序。默认排在选中高亮之前，先隐藏再谈高亮
   * @defaultValue 50
   */
  order?: number
  /**
   * 任一端点被隐藏时一并隐藏该边
   * @defaultValue true
   */
  hideDanglingEdges?: boolean
}

export interface UseSigmaFilterReturn {
  /** 节点谓词，为空表示不过滤 */
  nodeFilter: Ref<SigmaNodePredicate | null>
  /** 边谓词，为空表示不过滤 */
  edgeFilter: Ref<SigmaEdgePredicate | null>
  /** 只保留给定的节点，传 `null` 取消 */
  only: (keys: Iterable<string> | null) => void
  /** 清空所有过滤 */
  reset: () => void
  /** 当前被隐藏的节点数 */
  hiddenCount: ComputedRef<number>
}

/**
 * 声明式过滤，经 reducer 链落到显示数据的 `hidden` 上。
 *
 * 不改动图数据本身：过滤是视图层的事，被隐藏的节点仍在 graphology 里，
 * 邻域计算与检索照常能看到它们。
 */
export function useSigmaFilter(options: UseSigmaFilterOptions = {}): UseSigmaFilterReturn {
  const { order = 50, hideDanglingEdges = true } = options

  const { graph } = useSigma()
  const { version } = useSigmaGraph()

  const nodeFilter = shallowRef<SigmaNodePredicate | null>(null)
  const edgeFilter = shallowRef<SigmaEdgePredicate | null>(null)

  function isNodeVisible(key: string): boolean {
    const predicate = nodeFilter.value
    if (!predicate || !graph.value.hasNode(key)) {
      return true
    }
    return predicate(key, graph.value.getNodeAttributes(key))
  }

  const hiddenCount = computed(() => {
    void version.value
    if (!nodeFilter.value) {
      return 0
    }
    let count = 0
    graph.value.forEachNode((node) => {
      if (!isNodeVisible(node)) {
        count++
      }
    })
    return count
  })

  const { refresh } = useSigmaReducer({
    order,
    node(key, data) {
      return (isNodeVisible(key) ? data : { ...data, hidden: true }) as Partial<NodeDisplayData>
    },
    edge(key, data) {
      const predicate = edgeFilter.value

      if (predicate && graph.value.hasEdge(key) && !predicate(key, graph.value.getEdgeAttributes(key))) {
        return { ...data, hidden: true } as Partial<EdgeDisplayData>
      }

      if (hideDanglingEdges && nodeFilter.value && graph.value.hasEdge(key)) {
        const [source, target] = graph.value.extremities(key)
        if (!isNodeVisible(source) || !isNodeVisible(target)) {
          return { ...data, hidden: true } as Partial<EdgeDisplayData>
        }
      }

      return data as Partial<EdgeDisplayData>
    }
  })

  watch([nodeFilter, edgeFilter], refresh)

  return {
    nodeFilter,
    edgeFilter,
    hiddenCount,

    only(keys) {
      if (!keys) {
        nodeFilter.value = null
        return
      }
      const allowed = new Set(keys)
      nodeFilter.value = key => allowed.has(key)
    },

    reset() {
      nodeFilter.value = null
      edgeFilter.value = null
    }
  }
}

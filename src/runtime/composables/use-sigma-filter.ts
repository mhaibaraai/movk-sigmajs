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
 * 声明式过滤，经 reducer 链落到显示数据的 `visibility` 上。
 *
 * 选 `visibility` 而不是「把颜色/透明度/图标逐个归零」：前者是独占语义字段，sigma
 * 在顶点缓冲层面统一短路所有图层（连标签、backdrop、labelBackground、attachment
 * 一起关掉）并让元素退出拾取，下游归约器不会碰它；后者要求库知道消费方挂载了哪些
 * 渲染层，而图标层的可见性只认 `data.image`、写死成字符串的层颜色会编译成 uniform
 * 根本盖不住，永远做不完整。
 *
 * **要求 sigma >= 4.0.0-beta.3**：更早的版本对 `visibility: 'hidden'` 走的是 v3 遗留的
 * 「整个顶点缓冲清零」分支，而 v4 的几何/颜色已搬进纹理、缓冲里只剩纹理行号，
 * 清零后行号读回 0——索引 0 是真实存在的第一个 item，于是每个隐藏元素都被画成它的
 * 副本、并顶掉它的拾取 ID，边的 dash/gap 也会错位。上游在 `4.0.0-beta.3` 修掉了这两处，
 * 降级不会报错、只会静默渲染错误。
 *
 * 不改动图数据本身：过滤是视图层的事，被隐藏的节点仍在 graphology 里，邻域计算与
 * 检索照常能看到它们。与 `useSigmaState().setNodeState(key, { isHidden })` 的分工是——
 * 后者表达「这个节点被主动藏起来了」，会进 sigma 的状态供 styles 消费；本 composable
 * 表达的是一条随时可撤销的视图规则。
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

  function isEdgeVisible(key: string): boolean {
    if (!graph.value.hasEdge(key)) {
      return true
    }
    const predicate = edgeFilter.value
    if (predicate && !predicate(key, graph.value.getEdgeAttributes(key))) {
      return false
    }
    if (hideDanglingEdges && nodeFilter.value) {
      const [source, target] = graph.value.extremities(key)
      if (!isNodeVisible(source) || !isNodeVisible(target)) {
        return false
      }
    }
    return true
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
      return (isNodeVisible(key) ? data : { ...data, visibility: 'hidden' }) as Partial<NodeDisplayData>
    },
    edge(key, data) {
      return (isEdgeVisible(key) ? data : { ...data, visibility: 'hidden' }) as Partial<EdgeDisplayData>
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

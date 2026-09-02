import { computed, onScopeDispose, shallowRef, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { Attributes } from 'graphology-types'
import { useSigma } from './use-sigma'
import { useSigmaGraph } from './use-sigma-graph'
import { useSigmaState } from './use-sigma-state'

/** 返回 true 表示保留，false 表示隐藏 */
export type SigmaNodePredicate = (key: string, attributes: Attributes) => boolean
export type SigmaEdgePredicate = (key: string, attributes: Attributes) => boolean

export interface UseSigmaFilterOptions {
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
 * 声明式过滤，落到 sigma 的 `isHidden` 状态上。
 *
 * `isHidden` 是 v4 的独占语义状态，`DEFAULT_STYLES` 把它绑到 `visibility`，sigma 在
 * 顶点缓冲层面统一短路所有图层（标签、backdrop、attachment 一起关掉）并让元素退出拾取。
 * 传了自定义 `styles` 却把 `stylesBase` 设成 `'none'` 时这条绑定会缺失，隐藏将不生效。
 *
 * 不改动图数据：被隐藏的节点仍在 graphology 里，邻域计算与检索照常能看到它们。
 */
export function useSigmaFilter(options: UseSigmaFilterOptions = {}): UseSigmaFilterReturn {
  const { hideDanglingEdges = true } = options

  const { graph } = useSigma()
  const { version } = useSigmaGraph()
  const { setNodesState, setEdgesState } = useSigmaState()

  const nodeFilter = shallowRef<SigmaNodePredicate | null>(null)
  const edgeFilter = shallowRef<SigmaEdgePredicate | null>(null)

  const hiddenNodes = computed(() => {
    void version.value
    const hidden = new Set<string>()
    const predicate = nodeFilter.value
    if (!predicate) {
      return hidden
    }
    graph.value.forEachNode((key, attributes) => {
      if (!predicate(key, attributes)) {
        hidden.add(key)
      }
    })
    return hidden
  })

  const hiddenEdges = computed(() => {
    void version.value
    const hidden = new Set<string>()
    const predicate = edgeFilter.value
    if (!predicate && !(hideDanglingEdges && nodeFilter.value)) {
      return hidden
    }
    graph.value.forEachEdge((key, attributes, source, target) => {
      if (predicate && !predicate(key, attributes)) {
        hidden.add(key)
        return
      }
      if (hideDanglingEdges && (hiddenNodes.value.has(source) || hiddenNodes.value.has(target))) {
        hidden.add(key)
      }
    })
    return hidden
  })

  const hiddenCount = computed(() => hiddenNodes.value.size)

  let previousNodes: string[] = []
  let previousEdges: string[] = []

  function sync() {
    const nextNodes = [...hiddenNodes.value]
    const nextEdges = [...hiddenEdges.value]

    const shownNodes = previousNodes.filter(key => !hiddenNodes.value.has(key))
    const shownEdges = previousEdges.filter(key => !hiddenEdges.value.has(key))

    if (shownNodes.length > 0) {
      setNodesState(shownNodes, { isHidden: false })
    }
    if (shownEdges.length > 0) {
      setEdgesState(shownEdges, { isHidden: false })
    }
    if (nextNodes.length > 0) {
      setNodesState(nextNodes, { isHidden: true })
    }
    if (nextEdges.length > 0) {
      setEdgesState(nextEdges, { isHidden: true })
    }

    previousNodes = nextNodes
    previousEdges = nextEdges
  }

  watch([hiddenNodes, hiddenEdges], sync)

  onScopeDispose(() => {
    if (previousNodes.length > 0) {
      setNodesState(previousNodes, { isHidden: false })
    }
    if (previousEdges.length > 0) {
      setEdgesState(previousEdges, { isHidden: false })
    }
  })

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

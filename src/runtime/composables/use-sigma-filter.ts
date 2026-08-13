import { computed, onScopeDispose, shallowRef, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { Attributes } from 'graphology-types'
import type { EdgeDisplayData, NodeDisplayData } from 'sigma/types'
import { useSigma } from './use-sigma'
import { useSigmaGraph } from './use-sigma-graph'
import { useSigmaReducer } from './use-sigma-reducer'

/**
 * 视觉上不可见、但仍走 sigma 正常渲染分支的显示数据补丁。
 *
 * 不用 `visibility: 'hidden'`：sigma v4-beta 的 WebGL 层对它走的是 v3 遗留的
 * 「整个顶点缓冲清零」分支，清零后顶点缓冲里的纹理行号（a_nodeIndex/a_edgeIndex）
 * 变成 0——而索引 0 是真实存在的第一个 item，于是每个「hidden」的节点/边都会被
 * GPU 当成 0 号 item 的完整副本画出来，还会顶掉 0 号的拾取 ID。这与具体 beta
 * 版本无关（jacomyal/sigma.js `v4` 分支 HEAD 同样如此），不会随升级自愈。
 *
 * 这里改用「不可见但正常」的补丁：`opacity` 是 sigma 通用图层打包函数
 * （基础填充 / @sigma/node-border / @sigma/node-piechart / @sigma/node-image 共用
 * 同一份工厂代码）对颜色 alpha 做的统一乘数，置 0 能一次性压住所有已挂载的图层；
 * `color: 'transparent'` 是基础填充层的双保险。item 仍走 processVisibleItem 的
 * 正常分支，纹理行号不会被清零，顺带也修掉了边的第二个 bug——`visibility:'hidden'`
 * 触发的提前 return 会跳过边的 dash/gap 纹理写入，导致后续边的行号错位；
 * 现在每条边都正常写入，行号永远与写入顺序对齐。
 *
 * 代价：这仍是一个「正常」item，会正常写入拾取缓冲——GPU 眼里它依然是一个
 * 可拾取的透明图形（sigma 拾取通道的顶点着色器会在几何尺寸之外再叠加一个固定的
 * `u_pickingPadding`，不管 `opacity`/`size` 压到多低都躲不掉）。因此点击/悬浮必须
 * 在应用层再挡一层，见 `SigmaContext.isNodeFilteredOut`/`isEdgeFilteredOut`
 * （由 `useSigmaSelection`、`SigmaOverlay`、`SigmaMiniMap` 消费）
 */
const HIDDEN_DISPLAY_PATCH = {
  color: 'transparent',
  opacity: 0,
  labelVisibility: 'hidden'
} as const

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
 * 声明式过滤，经 reducer 链落到 `HIDDEN_DISPLAY_PATCH`（透明度/颜色/标签可见性），
 * 不落到 `visibility` 上，原因见上方常量注释。点击/悬浮默认会自动跳过被过滤的
 * 节点/边，经共享的 `SigmaContext` 生效，不需要手动接线；绕开内置 `useSigmaSelection`
 * 自己用 `useSigmaEvents` 接管交互的调用方，需要自行查 `useSigma().isNodeFilteredOut`。
 *
 * 不改动图数据本身：过滤是视图层的事，被隐藏的节点仍在 graphology 里，邻域计算与
 * 检索照常能看到它们。与 `useSigmaState().setNodeState(key, { isHidden })` 的分工是——
 * 后者表达「这个节点被主动藏起来了」，会进 sigma 的状态供 styles 消费，走的是
 * `visibility: 'hidden'`，同样会触发上面这个 GPU 缺陷，只是这个 composable 管不到
 * 用户自己写的 `styles` 声明；本 composable 表达的是一条随时可撤销的视图规则。
 */
export function useSigmaFilter(options: UseSigmaFilterOptions = {}): UseSigmaFilterReturn {
  const { order = 50, hideDanglingEdges = true } = options

  const { graph, registerVisibilityGuard } = useSigma()
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

  onScopeDispose(registerVisibilityGuard({
    isNodeHidden: key => !isNodeVisible(key),
    isEdgeHidden: key => !isEdgeVisible(key)
  }))

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
      return (isNodeVisible(key) ? data : { ...data, ...HIDDEN_DISPLAY_PATCH }) as Partial<NodeDisplayData>
    },
    edge(key, data) {
      return (isEdgeVisible(key) ? data : { ...data, ...HIDDEN_DISPLAY_PATCH }) as Partial<EdgeDisplayData>
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

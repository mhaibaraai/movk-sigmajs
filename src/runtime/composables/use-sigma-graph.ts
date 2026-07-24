import { computed, onScopeDispose, readonly, shallowRef, toValue, watch } from 'vue'
import type Graph from 'graphology'
import type { MaybeRefOrGetter, Ref } from 'vue'
import { useSigma } from './use-sigma'

/** graphology 会改变图内容的全部事件 */
const GRAPH_EVENTS = [
  'nodeAdded',
  'nodeDropped',
  'nodeAttributesUpdated',
  'edgeAdded',
  'edgeDropped',
  'edgeAttributesUpdated',
  'cleared',
  'edgesCleared',
  'attributesUpdated'
] as const

export interface UseSigmaGraphReturn {
  /** 原生 graphology 实例 */
  graph: Readonly<Ref<Graph>>
  /** 图每次变更后递增，用于让计算属性重算或作为缓存键 */
  version: Readonly<Ref<number>>
  /** 节点数 */
  order: Readonly<Ref<number>>
  /** 边数 */
  size: Readonly<Ref<number>>
  /** 图变更时触发的回调，随作用域自动注销 */
  onGraphUpdate: (callback: () => void) => void
}

/**
 * 把 graphology 的变更桥接成 Vue 的响应式信号。
 *
 * graphology 的 `Graph` 是纯可变对象，Vue 的响应式系统抓不到它的变更，
 * 依赖图状态的 UI（图例、统计、检索结果）不会自动更新。此处订阅图事件并递增
 * `version`，让下游用常规的 `computed` / `watch` 即可响应。
 *
 * 不传参数时取当前 `SigmaGraph` 上下文中的图。
 */
export function useSigmaGraph(source?: MaybeRefOrGetter<Graph>): UseSigmaGraphReturn {
  const contextGraph = source === undefined ? useSigma().graph : undefined
  const graph = computed<Graph>(() => (source === undefined ? contextGraph!.value : toValue(source)))

  const version = shallowRef(0)
  const listeners = new Set<() => void>()

  function bump() {
    version.value++
    for (const listener of listeners) {
      listener()
    }
  }

  let attached: Graph | null = null

  function detach() {
    if (!attached) {
      return
    }
    for (const event of GRAPH_EVENTS) {
      attached.off(event, bump)
    }
    attached = null
  }

  function attach(next: Graph) {
    detach()
    for (const event of GRAPH_EVENTS) {
      next.on(event, bump)
    }
    attached = next
  }

  watch(graph, (next) => {
    attach(next)
    bump()
  }, { immediate: true })

  onScopeDispose(() => {
    detach()
    listeners.clear()
  })

  // 读一次 version 建立依赖，图变更后这些派生值才会重算
  const order = computed(() => {
    void version.value
    return graph.value.order
  })

  const size = computed(() => {
    void version.value
    return graph.value.size
  })

  return {
    graph,
    version: readonly(version),
    order,
    size,
    onGraphUpdate(callback) {
      listeners.add(callback)
      onScopeDispose(() => listeners.delete(callback))
    }
  }
}

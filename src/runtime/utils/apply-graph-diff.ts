import type Graph from 'graphology'
import type { Attributes, SerializedGraph } from 'graphology-types'

export interface ApplyGraphDiffOptions {
  /**
   * 已存在节点若在新数据中未显式给出 x / y，保留图上现有坐标。
   * 关闭后节点会丢失布局结果，视觉上整张图会跳一次。
   * @defaultValue true
   */
  preservePositions?: boolean
  /**
   * 移除新数据中不存在的节点与边。
   * 增量合入局部数据（如邻域展开）时应关闭。
   * @defaultValue true
   */
  prune?: boolean
}

/**
 * 把 `SerializedGraph` 增量同步到 graphology 实例，替代 `clear()` 加 `import()`。
 *
 * 节点属性按新数据整体替换，唯一例外是 `preservePositions` 下的 x / y：
 * 新数据显式给出时以新值为准，未给出则沿用图上现有坐标。
 *
 * graphology 实例本身就是可变数据结构，此处直接 mutation 是有意为之。
 */
export function applyGraphDiff(
  graph: Graph,
  next: SerializedGraph,
  options: ApplyGraphDiffOptions = {}
): void {
  const { preservePositions = true, prune = true } = options

  const nextNodeKeys = new Set(next.nodes.map(node => String(node.key)))

  if (prune) {
    for (const key of graph.nodes()) {
      if (!nextNodeKeys.has(key)) {
        graph.dropNode(key)
      }
    }
  }

  for (const node of next.nodes) {
    const key = String(node.key)
    const attributes: Attributes = { ...node.attributes }

    if (!graph.hasNode(key)) {
      graph.addNode(key, attributes)
      continue
    }

    if (preservePositions) {
      if (attributes.x === undefined) {
        attributes.x = graph.getNodeAttribute(key, 'x')
      }
      if (attributes.y === undefined) {
        attributes.y = graph.getNodeAttribute(key, 'y')
      }
    }

    graph.replaceNodeAttributes(key, attributes)
  }

  const touchedEdgeKeys = new Set<string>()

  for (const edge of next.edges) {
    const source = String(edge.source)
    const target = String(edge.target)

    // 增量合入局部数据时，边可能指向尚未加载的节点。这属于「概览 + 按需扩展」的正常情况，
    // 跳过即可；直接交给 graphology 只会抛出难以定位的 NotFoundGraphError
    if (!graph.hasNode(source) || !graph.hasNode(target)) {
      if (import.meta.dev) {
        console.warn(`[@movk/sigma] 边 ${source} → ${target} 的端点不在图中，已跳过`)
      }
      continue
    }

    const attributes: Attributes = { ...edge.attributes }

    // 多重图上无 key 的边一律新增：按端点匹配会让三条 a→b 压成一条。
    // 代价是每次全量同步边 key 会重新生成，需要稳定边身份或用 prune: false 增量合入时请显式给 key
    const existingKey = edge.key !== undefined
      ? String(edge.key)
      : (graph.multi ? undefined : graph.edge(source, target))

    if (existingKey !== undefined && graph.hasEdge(existingKey)) {
      graph.replaceEdgeAttributes(existingKey, attributes)
      touchedEdgeKeys.add(existingKey)
      continue
    }

    touchedEdgeKeys.add(
      existingKey === undefined
        ? graph.addEdge(source, target, attributes)
        : graph.addEdgeWithKey(existingKey, source, target, attributes)
    )
  }

  if (prune) {
    for (const key of graph.edges()) {
      if (!touchedEdgeKeys.has(key)) {
        graph.dropEdge(key)
      }
    }
  }
}

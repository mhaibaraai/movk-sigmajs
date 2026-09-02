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

const CONTRACT_HINT = '需要 graphology 的 SerializedGraph（graph.export() 的产物）'

function fields(value: unknown): string {
  return value && typeof value === 'object' ? Object.keys(value).join(', ') : String(value)
}

/** 原始数据集几乎不会正好是 SerializedGraph，形状不对时立刻点名缺失字段，别等到逐条边失败 */
function assertSerializedGraph(next: SerializedGraph): void {
  if (!Array.isArray(next?.nodes) || !Array.isArray(next?.edges)) {
    throw new TypeError(`[@movk/sigma] data.nodes 与 data.edges 必须是数组，${CONTRACT_HINT}。收到的字段：${fields(next)}`)
  }

  const node = next.nodes[0]
  if (node !== undefined && node.key === undefined) {
    throw new TypeError(`[@movk/sigma] data.nodes[0] 缺少 key，${CONTRACT_HINT}。收到的字段：${fields(node)}`)
  }

  const edge = next.edges[0]
  if (edge !== undefined && (edge.source === undefined || edge.target === undefined)) {
    throw new TypeError(`[@movk/sigma] data.edges[0] 缺少 source 或 target，${CONTRACT_HINT}。收到的字段：${fields(edge)}`)
  }
}

/**
 * 把 `SerializedGraph` 增量同步到 graphology 实例，替代 `clear()` 加 `import()`。
 *
 * 节点属性按新数据整体替换，唯一例外是 `preservePositions` 下的 x / y：
 * 新数据显式给出时以新值为准，未给出则沿用图上现有坐标。
 */
export function applyGraphDiff(
  graph: Graph,
  next: SerializedGraph,
  options: ApplyGraphDiffOptions = {}
): void {
  const { preservePositions = true, prune = true } = options

  assertSerializedGraph(next)

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
  const dangling: string[] = []

  for (const edge of next.edges) {
    const source = String(edge.source)
    const target = String(edge.target)

    // 增量合入局部数据时，边可能指向尚未加载的节点。这是「概览 + 按需扩展」的正常情况，
    // 跳过即可；交给 graphology 只会抛出难以定位的 NotFoundGraphError
    if (!graph.hasNode(source) || !graph.hasNode(target)) {
      dangling.push(`${source} → ${target}`)
      continue
    }

    const attributes: Attributes = { ...edge.attributes }

    // 多重图上无 key 的边一律新增：按端点匹配会让三条 a→b 压成一条。
    // 需要稳定边身份时显式给 key
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

  if (dangling.length > 0 && import.meta.dev) {
    console.warn(`[@movk/sigma] 已跳过 ${dangling.length} 条端点不在图中的边，前几条：${dangling.slice(0, 3).join('、')}`)
  }

  if (prune) {
    for (const key of graph.edges()) {
      if (!touchedEdgeKeys.has(key)) {
        graph.dropEdge(key)
      }
    }
  }
}

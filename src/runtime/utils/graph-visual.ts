import type Graph from 'graphology'
import type { LabelPosition } from 'sigma/types'

export interface LabelPlacementsOptions {
  /**
   * 横向偏置。标签横向占位远宽于纵向，只有邻居明显偏在水平方向时才把标签甩到左右
   * @defaultValue 1.6
   */
  horizontalBias?: number
}

export interface DegreeToTierOptions {
  /**
   * 各档位的累计占比，升序。`[0.15, 0.5]` 表示排名前 15% 为 0 档、前 50% 为 1 档、
   * 其余为 2 档。首档向上取整，保证至少有一个节点落进最高档
   * @defaultValue `[0.15, 0.5]`
   */
  ratios?: readonly number[]
  /**
   * 度数相同时的次级排序依据，返回值越大排名越靠前。缺省不做次级排序，
   * 同度数的节点按 key 的字典序排定，保证同一份数据每次结果一致
   */
  rank?: (graph: Graph, node: string) => number
}

/**
 * 给每个节点选一个背离邻居的标签方位，返回 `节点 key → 方位` 的映射表。
 *
 * 邻居单位向量之和指向连线最密的方向，取反即最空的一侧。孤立节点一律取 `'below'`。
 *
 * **必须在布局写完坐标之后调用**：方位完全由邻居的相对位置决定。返回值可直接喂给
 * styles 的 `labelPosition`。
 */
export function labelPlacements(
  graph: Graph,
  options: LabelPlacementsOptions = {}
): Record<string, LabelPosition> {
  const { horizontalBias = 1.6 } = options
  const placements: Record<string, LabelPosition> = {}

  graph.forEachNode((node, attributes) => {
    let sumX = 0
    let sumY = 0

    for (const neighbor of graph.neighbors(node)) {
      // y 取反：图坐标 y 向上，视口 y 向下
      const dx = (graph.getNodeAttribute(neighbor, 'x') as number) - (attributes.x as number)
      const dy = (attributes.y as number) - (graph.getNodeAttribute(neighbor, 'y') as number)
      const distance = Math.hypot(dx, dy)

      if (distance > 0) {
        sumX += dx / distance
        sumY += dy / distance
      }
    }

    const awayX = -sumX
    const awayY = -sumY

    if (Math.abs(awayX) > horizontalBias * Math.abs(awayY)) {
      placements[node] = awayX > 0 ? 'right' : 'left'
    }
    else {
      placements[node] = awayY < 0 ? 'above' : 'below'
    }
  })

  return placements
}

/**
 * 按度数排名给节点分标签档位，返回 `节点 key → 档位` 的映射表，档位越小越重要。
 *
 * 要的是**排名**而非取值：标签的显示优先级是相对的，一张图里该出多少标签由屏幕空间
 * 决定，与度数的绝对大小无关。
 *
 * @example
 * ```ts
 * const tiers = degreeToTier(graph, { rank: (g, node) => g.getNodeAttribute(node, 'pagerank') ?? 0 })
 * for (const [node, tier] of Object.entries(tiers)) {
 *   graph.setNodeAttribute(node, 'labelTier', tier)
 * }
 * ```
 */
export function degreeToTier(
  graph: Graph,
  options: DegreeToTierOptions = {}
): Record<string, number> {
  const { ratios = [0.15, 0.5], rank } = options
  const total = graph.order
  const tiers: Record<string, number> = {}

  if (total === 0) {
    return tiers
  }

  const ranked = graph.nodes().sort((a, b) =>
    graph.degree(b) - graph.degree(a)
    || (rank ? rank(graph, b) - rank(graph, a) : 0)
    || a.localeCompare(b)
  )

  // 累计人数逐档递增，比例写反或重复时也不会让后一档反超前一档
  let previous = 0
  const bounds = ratios.map((ratio, index) => {
    const count = index === 0 ? Math.ceil(total * ratio) : Math.round(total * ratio)
    previous = Math.max(previous, count)

    return previous
  })

  ranked.forEach((node, index) => {
    const tier = bounds.findIndex(bound => index < bound)
    tiers[node] = tier === -1 ? bounds.length : tier
  })

  return tiers
}

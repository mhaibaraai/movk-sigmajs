import { mapRange } from '@movk/core'
import type Graph from 'graphology'
import type { SigmaLabelPlacement } from './label-anchor'

/**
 * 分类配色的默认调色板，取自常见的可访问色板，相邻两色在色相上足够分开。
 * 社区数超出长度时循环取用。
 */
export const DEFAULT_COMMUNITY_PALETTE: readonly string[] = [
  '#f43f5e',
  '#3b82f6',
  '#22c55e',
  '#a855f7',
  '#f59e0b',
  '#14b8a6',
  '#ec4899',
  '#84cc16'
]

/**
 * 把节点度数按 sqrt 曲线映射到尺寸区间，返回 `节点 key → size` 的映射表。
 *
 * 不用线性有两个原因：度数分布普遍偏斜（大量叶子节点加少数枢纽），线性映射会把绝大多数
 * 节点钉在区间下界、枢纽独占上界；而尺寸是按面积被感知的，半径 ∝ sqrt(度数) 才让面积
 * 正比于度数。端点取值不受影响，只有中间段整体抬高。
 *
 * 只返回映射表而不直接写图：是否落到 `size` 属性、还是交给 reducer 只影响显示，
 * 由调用方决定。全图度数相同时所有节点取区间下界。
 *
 * 目标尺寸区间默认为 `[4, 20]`。
 */
export function degreeToSize(graph: Graph, range: [number, number] = [4, 20]): Record<string, number> {
  const degrees = graph.nodes().map(node => graph.degree(node))
  const min = degrees.length === 0 ? 0 : Math.min(...degrees)
  const max = degrees.length === 0 ? 0 : Math.max(...degrees)
  const span = max - min

  const sizes: Record<string, number> = {}

  graph.forEachNode((node) => {
    const eased = span === 0 ? 0 : Math.sqrt((graph.degree(node) - min) / span)
    sizes[node] = mapRange(eased, [0, 1], range, { clamp: true })
  })

  return sizes
}

/**
 * 把社区编号映射为颜色，返回 `节点 key → color` 的映射表。
 *
 * 入参是社区划分结果而非图，因此本函数不依赖 `graphology-communities-louvain`
 * 这个可选 peer，可直接接 `useSigmaMetrics().communities()` 的返回值。
 * 编号超出调色板长度时循环取用，负数编号也能正确回绕。
 *
 * 未指定调色板时用 {@link DEFAULT_COMMUNITY_PALETTE}。
 */
export function communityToColor(
  communities: Record<string, number>,
  palette: readonly string[] = DEFAULT_COMMUNITY_PALETTE
): Record<string, string> {
  const colors: Record<string, string> = {}

  if (palette.length === 0) {
    return colors
  }

  for (const [node, community] of Object.entries(communities)) {
    const index = ((community % palette.length) + palette.length) % palette.length
    colors[node] = palette[index]!
  }

  return colors
}

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
 * 邻居单位向量之和指向连线最密的方向，取反即最空的一侧，标签放在那里最不容易压到边。
 * 孤立节点没有邻居可参考，一律取 `'bottom'`。
 *
 * **必须在布局写完坐标之后调用**：方位完全由邻居的相对位置决定，坐标一变结论就作废。
 * 换算时把图坐标的 y 轴翻转成视口朝向（图坐标 y 向上，屏幕 y 向下），返回值可直接
 * 喂给 {@link createLabelRenderer} 读取的 `labelPlacement` 属性。
 */
export function labelPlacements(
  graph: Graph,
  options: LabelPlacementsOptions = {}
): Record<string, SigmaLabelPlacement> {
  const { horizontalBias = 1.6 } = options
  const placements: Record<string, SigmaLabelPlacement> = {}

  graph.forEachNode((node, attributes) => {
    let sumX = 0
    let sumY = 0

    for (const neighbor of graph.neighbors(node)) {
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
      placements[node] = awayY < 0 ? 'top' : 'bottom'
    }
  })

  return placements
}

/**
 * 按度数排名给节点分标签档位，返回 `节点 key → 档位` 的映射表，档位越小越重要。
 *
 * 与 {@link degreeToSize} 不同，这里要的是**排名**而非取值：标签的显示优先级是相对的，
 * 一张图里该出多少标签由屏幕空间决定，与度数的绝对大小无关。
 *
 * 只返回映射不写图：档位通常同时用于字号（交给 {@link createLabelRenderer} 的 `tiers`）
 * 与强制显示（sigma 的 `forceLabel`），后者是否要开由调用方决定。
 *
 * @example
 * ```ts
 * const tiers = degreeToTier(graph, { rank: (g, node) => g.getNodeAttribute(node, 'pagerank') ?? 0 })
 * for (const [node, tier] of Object.entries(tiers)) {
 *   graph.mergeNodeAttributes(node, { labelTier: tier, forceLabel: tier === 0 })
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

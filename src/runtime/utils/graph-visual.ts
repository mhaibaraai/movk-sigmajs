import { mapRange } from '@movk/core'
import type Graph from 'graphology'

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
 * 把节点度数线性映射到尺寸区间，返回 `节点 key → size` 的映射表。
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

  const sizes: Record<string, number> = {}

  graph.forEachNode((node) => {
    sizes[node] = mapRange(graph.degree(node), [min, max], range, { clamp: true })
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

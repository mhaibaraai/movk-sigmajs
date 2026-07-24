import type { SerializedGraph } from 'graphology-types'

/**
 * 邻域接口。返回中心节点的 N 度邻域子图，前端经
 * useSigmaNeighborhood().expand() 增量合入。
 */
export default defineEventHandler((event): SerializedGraph => {
  const id = getRouterParam(event, 'id')
  const { depth } = getQuery(event)
  const levels = Math.min(3, Math.max(1, Number(depth) || 1))

  if (!id || !findNode(id)) {
    throw createError({ statusCode: 404, statusMessage: `节点 ${id} 不存在` })
  }

  const source = corpus()
  const visited = new Set([id])
  let frontier = new Set([id])

  for (let level = 0; level < levels; level++) {
    const next = new Set<string>()

    for (const edge of source.edges) {
      const from = String(edge.source)
      const to = String(edge.target)

      // 无向可达性：出入两侧都算邻居，正是图谱浏览要的语义
      if (frontier.has(from) && !visited.has(to)) {
        visited.add(to)
        next.add(to)
      }
      else if (frontier.has(to) && !visited.has(from)) {
        visited.add(from)
        next.add(from)
      }
    }

    if (next.size === 0) {
      break
    }
    frontier = next
  }

  return subgraph(visited)
})

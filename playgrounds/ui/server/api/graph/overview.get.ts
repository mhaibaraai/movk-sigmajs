import type { SerializedGraph } from 'graphology-types'

/**
 * 概览接口。按度数取前 limit 个节点，连同两端都入选的边。
 *
 * 万级图一次性下发既慢又看不清，首屏只给枢纽，其余交给邻域接口按需补齐。
 */
export default defineEventHandler((event): SerializedGraph => {
  const { limit } = getQuery(event)
  const size = Math.min(1000, Math.max(10, Number(limit) || 300))

  const keys = new Set(
    corpus().nodes
      .slice()
      .sort((a, b) => (b.attributes?.degree ?? 0) - (a.attributes?.degree ?? 0))
      .slice(0, size)
      .map(node => String(node.key))
  )

  return subgraph(keys)
})

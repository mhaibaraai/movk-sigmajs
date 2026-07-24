import type Graph from 'graphology'
import type { SerializedGraph } from 'graphology-types'

/**
 * 按度数取前 N 个节点，连同两端都入选的边，得到一张概览子图。
 *
 * 用于「概览 + 按需扩展」：万级节点一次性渲染既慢又看不清，先展示枢纽，
 * 再由 `useSigmaNeighborhood().expand()` 按需补齐。
 *
 * 复用 graphology 自身的 `export()` 再过滤，图级 `attributes` 与 `options`
 * 原样保留，结果可直接喂给 `SigmaGraph` 的 `data`。
 */
export function sampleGraph(graph: Graph, size: number): SerializedGraph {
  const exported = graph.export()

  if (size >= graph.order) {
    return exported
  }

  const kept = new Set(
    graph.nodes()
      .sort((a, b) => graph.degree(b) - graph.degree(a))
      .slice(0, Math.max(0, size))
  )

  return {
    ...exported,
    nodes: exported.nodes.filter(node => kept.has(String(node.key))),
    edges: exported.edges.filter(edge =>
      kept.has(String(edge.source)) && kept.has(String(edge.target))
    )
  }
}

import type { SerializedEdge, SerializedGraph, SerializedNode } from 'graphology-types'
import dataset from '../../public/data/wikipedia.json'

export interface WikipediaPayload {
  /** 只带语义属性的图，视觉映射交给 styles */
  data: SerializedGraph
  /** 社区 key 到颜色，喂给 `color: { attribute: 'cluster', dict }` */
  clusterColors: Record<string, string>
  /** 社区 key 到中文可读名，供图例与提示层用 */
  clusterLabels: Record<string, string>
  /** score 的取值区间，喂给 `size: { attribute: 'score', minValue, maxValue }` */
  scoreExtent: [min: number, max: number]
}

const { nodes, edges, clusters } = dataset

const clusterColors: Record<string, string> = {}
const clusterLabels: Record<string, string> = {}
for (const cluster of clusters) {
  clusterColors[cluster.key] = cluster.color
  clusterLabels[cluster.key] = cluster.clusterLabel
}

// 节点只存语义属性，颜色与尺寸不落进图数据，由 styles 的 attribute 绑定在渲染期算
const serializedNodes: SerializedNode[] = nodes.map(node => ({
  key: node.key,
  attributes: {
    label: node.label,
    x: node.x,
    y: node.y,
    cluster: node.cluster,
    score: node.score
  }
}))

const nodeKeys = new Set(nodes.map(node => node.key))
const seen = new Set<string>()
const serializedEdges: SerializedEdge[] = []

// 端点必须在图里，同一条有向端点对只保留一次。
// 边不给 key：非多重图上 applyGraphDiff 按端点匹配，自动生成的 key 只会白占体积
for (const [source, target] of edges) {
  if (source === undefined || target === undefined) {
    continue
  }
  const pair = JSON.stringify([source, target])
  if (!nodeKeys.has(source) || !nodeKeys.has(target) || seen.has(pair)) {
    continue
  }
  seen.add(pair)
  serializedEdges.push({ source, target })
}

const scores = nodes.map(node => node.score)

const payload: WikipediaPayload = {
  data: {
    attributes: {},
    options: { type: 'mixed', multi: false, allowSelfLoops: true },
    nodes: serializedNodes,
    edges: serializedEdges
  },
  clusterColors,
  clusterLabels,
  scoreExtent: [Math.min(...scores), Math.max(...scores)]
}

export default eventHandler(async () => payload)

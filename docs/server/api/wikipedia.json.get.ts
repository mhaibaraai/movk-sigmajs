import type { SerializedEdge, SerializedGraph, SerializedNode } from 'graphology-types'
import dataset from '../../public/data/wikipedia.json'

/** 数据集节点，坐标由上游预先跑好，节点自身不带 color 与 size */
interface WikipediaNode {
  key: string
  label: string
  /** 词条类型，一多半是 `"unknown"`，做不了分类 */
  tag: string
  /** 所属社区的 key，分类一律用它 */
  cluster: string
  URL: string
  x: number
  y: number
  /** 上游算好的重要度，styles 里换算成节点 size */
  score: number
}

interface WikipediaCluster {
  key: string
  color: string
  clusterLabel: string
}

interface WikipediaDataset {
  nodes: WikipediaNode[]
  edges: [source: string, target: string][]
  clusters: WikipediaCluster[]
  tags: { key: string, image: string }[]
}

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

const { nodes, edges, clusters } = dataset as unknown as WikipediaDataset

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
  const pair = JSON.stringify([source, target])
  if (!nodeKeys.has(source) || !nodeKeys.has(target) || seen.has(pair)) {
    continue
  }
  seen.add(pair)
  serializedEdges.push({ source, target })
}

const scores = nodes.map(node => node.score)

// 模块只求值一次，转换随之只跑一次，请求到来时直接吐现成结果
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

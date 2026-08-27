import Graph from 'graphology'

/** 数据集节点，坐标由上游预先跑好，节点自身不带 color 与 size */
export interface WikipediaNode {
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

export interface WikipediaCluster {
  key: string
  color: string
  clusterLabel: string
}

export interface WikipediaDataset {
  nodes: WikipediaNode[]
  edges: [source: string, target: string][]
  clusters: WikipediaCluster[]
  tags: { key: string, image: string }[]
}

export interface WikipediaGraph {
  /** 只带语义属性的图，视觉映射交给 styles */
  graph: Graph
  /** 社区 key 到颜色，喂给 `color: { attribute: 'cluster', dict }` */
  clusterColors: Record<string, string>
  /** 社区 key 到中文可读名，供图例与提示层用 */
  clusterLabels: Record<string, string>
  /** score 的取值区间，喂给 `size: { attribute: 'score', minValue, maxValue }` */
  scoreExtent: [min: number, max: number]
}

/**
 * 把原始数据集转成 graphology 实例。
 *
 * 节点只存 `label` / `x` / `y` / `cluster` / `score` 这些语义属性，颜色与尺寸不落进
 * 图数据，由 styles 的 attribute 绑定在渲染期算。
 */
export function toWikipediaGraph(dataset: WikipediaDataset): WikipediaGraph {
  const graph = new Graph()

  const clusterColors: Record<string, string> = {}
  const clusterLabels: Record<string, string> = {}
  for (const cluster of dataset.clusters) {
    clusterColors[cluster.key] = cluster.color
    clusterLabels[cluster.key] = cluster.clusterLabel
  }

  let min = Infinity
  let max = -Infinity

  for (const node of dataset.nodes) {
    graph.addNode(node.key, {
      label: node.label,
      x: node.x,
      y: node.y,
      cluster: node.cluster,
      score: node.score
    })
    min = Math.min(min, node.score)
    max = Math.max(max, node.score)
  }

  // 原数据集里同一对端点会重复出现，非多重图上必须去重
  for (const [source, target] of dataset.edges) {
    if (graph.hasNode(source) && graph.hasNode(target) && !graph.hasEdge(source, target)) {
      graph.addEdge(source, target)
    }
  }

  return {
    graph,
    clusterColors,
    clusterLabels,
    scoreExtent: [min, max]
  }
}

import type { SerializedGraph } from 'graphology-types'
import subset from '../data/wikipedia-subset.json'

/**
 * 示例数据源。
 *
 * 组件示例内联自己的数据（数据形状本身就是演示内容），composable 与规模示例
 * 用这里的取样器——那些示例要讲的是行为，数据只是背景板。
 *
 * 数据来自 sigma.js 官方 v4 网站的 `wikipedia.json`：维基百科上数据可视化相关词条
 * 构成的引用网络，坐标由上游预先跑好。完整数据集在 `docs/public/data/`，这里同步
 * 引用的是它的 160 节点子集，派生方式见 `docs/scripts/build-wikipedia-subset.mjs`。
 *
 * 节点分类沿用数据集自带的英文社区名；边的关系名是中文，由本文件按两端是否同社区
 * 派生——原数据集的边不带任何属性。
 *
 * 本文件随 examples 目录一起搬迁到文档站。
 */

/** 坐标跨度，与 .example-stage 的 420px 减去 stagePadding 后的可用高度对齐 */
const SPAN = 360

interface SubsetNode {
  key: string
  label: string
  category: string
  color: string
  x: number
  y: number
  degree: number
}

const NODES = subset.nodes as SubsetNode[]
const EDGES = subset.edges as [string, string][]

const NODE_BY_KEY = new Map(NODES.map(node => [node.key, node]))

const NEIGHBORS = new Map<string, string[]>(NODES.map(node => [node.key, []]))
for (const [source, target] of EDGES) {
  NEIGHBORS.get(source)!.push(target)
  NEIGHBORS.get(target)!.push(source)
}

/** 子集里度数最高的节点。取样一律从它出发，于是 `n0` 恒为整张图的枢纽 */
const HUB = NODES.reduce((best, node) => (node.degree > best.degree ? node : best), NODES[0]!).key

export interface DemoGraphOptions {
  /**
   * 节点数
   * @defaultValue 9
   */
  nodes?: number
  /**
   * 每个节点额外连出的边数，0 表示只保留生成树
   * @defaultValue 1
   */
  extraEdges?: number
  /**
   * 是否允许平行边与自环
   * @defaultValue false
   */
  multi?: boolean
}

/**
 * 一张几十个节点以内的小图，带 label / category / color，够演示大部分行为。
 *
 * 从枢纽节点做 BFS 取一块连通子图，坐标沿用数据集里跑好的布局，不跑布局也能看清结构。
 * 节点 key 重编为 `n0..nN`（`n0` 即枢纽）：示例与文档正文按这套稳定 id 引用节点，
 * 换数据源也不会失效。
 *
 * 坐标重新归一化到 360 个单位的跨度。sigma v4 的 `size` 是图坐标单位
 * （`itemSizesReference` 默认 `'positions'`），跨度与舞台像素高度对齐后 size 数值
 * 才约等于像素半径。
 */
export function demoGraph(options: DemoGraphOptions = {}): SerializedGraph {
  const { nodes: count = 9, extraEdges = 1, multi = false } = options

  const picked = collectConnected(Math.max(1, Math.min(count, NODES.length)))
  const links = selectEdges(picked, extraEdges)
  const { positions } = normalize(picked.map(key => NODE_BY_KEY.get(key)!))

  // 视觉尺寸看的是子图里的实际度数，不是节点在完整数据集里的度数——
  // 否则子图里只连了一条边的节点会画成一个大球，与眼见的结构对不上
  const degrees = new Map(picked.map(key => [key, 0]))
  for (const [source, target] of links) {
    degrees.set(source, degrees.get(source)! + 1)
    degrees.set(target, degrees.get(target)! + 1)
  }

  const index = new Map(picked.map((key, position) => [key, `n${position}`]))

  const nodes = picked.map((key, position) => {
    const node = NODE_BY_KEY.get(key)!

    return {
      key: `n${position}`,
      attributes: {
        label: node.label,
        category: node.category,
        x: positions[position]!.x,
        y: positions[position]!.y,
        size: 6 + Math.min(10, Math.sqrt(degrees.get(key)!) * 3),
        color: node.color
      }
    }
  })

  const edges = links.map(([source, target]) => ({
    source: index.get(source)!,
    target: index.get(target)!,
    attributes: {
      label: NODE_BY_KEY.get(source)!.category === NODE_BY_KEY.get(target)!.category ? '同类' : '跨域'
    }
  }))

  return {
    attributes: {},
    options: { type: 'mixed', multi, allowSelfLoops: true },
    nodes,
    edges
  }
}

/**
 * 规模示例用的大图。确定性生成，同样的入参每次结果一致，便于对比读数。
 *
 * 只有这一个仍是合成的：规模示例要 2k / 5k / 20k 节点，而官方 `public/data/` 里最大的
 * 图也只有 2085 个节点，上游那些万级数据集是构建时从 SNAP 下载、不入库的。规模示例讲
 * 的是体量不是语义，合成数据反而能精确控制节点数。
 *
 * 度数按幂律分布：新节点优先连到已有的高度数节点，于是 `sampleGraph` 的 Top-N
 * 抽样才有意义——均匀随机图上「取度数最高的 200 个」和随便取 200 个没有区别。
 */
export function createScaleGraph(nodeCount: number, edgeRatio = 3): SerializedGraph {
  const random = createRandom(nodeCount)
  const nodes: SerializedGraph['nodes'] = []
  const edges: SerializedGraph['edges'] = []

  // 分类词表取自 wikipedia 子集，与 demoGraph 保持同一套取值
  const palette = [...new Map(NODES.map(node => [node.category, node.color])).entries()]

  // 优先连接的候选池：节点每被连一次就多一个副本，被选中的概率随度数增长
  const pool: number[] = [0]

  // 优先连接会反复选中同一个高度数节点，非多重图上必须去重
  const pairs = new Set<string>()

  for (let index = 0; index < nodeCount; index++) {
    const angle = random() * Math.PI * 2
    // 越早插入的节点度数越高，把它们摆在靠中心的位置，幂律结构才看得出来；
    // 均匀撒点会得到一团看不出任何结构的圆斑
    const radius = (Math.sqrt(index / nodeCount) * 0.85 + random() * 0.15) * (SPAN / 2)
    const [category, color] = palette[index % palette.length]!

    nodes.push({
      key: `n${index}`,
      attributes: {
        label: `节点 ${index}`,
        category,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        size: 2,
        color
      }
    })

    if (index === 0) {
      continue
    }

    for (let n = 0; n < edgeRatio; n++) {
      const target = pool[Math.floor(random() * pool.length)]!
      if (target === index) {
        continue
      }

      const pair = `${Math.min(index, target)}-${Math.max(index, target)}`
      if (pairs.has(pair)) {
        continue
      }
      pairs.add(pair)

      edges.push({ source: `n${index}`, target: `n${target}` })
      pool.push(index, target)
    }
  }

  // 度数决定视觉尺寸，否则万级节点全是同一个点，看不出结构
  const degree = new Map<string, number>()
  for (const edge of edges) {
    degree.set(String(edge.source), (degree.get(String(edge.source)) ?? 0) + 1)
    degree.set(String(edge.target), (degree.get(String(edge.target)) ?? 0) + 1)
  }
  for (const node of nodes) {
    node.attributes!.size = 1.5 + Math.min(8, Math.sqrt(degree.get(String(node.key)) ?? 0))
  }

  return {
    attributes: {},
    options: { type: 'mixed', multi: false, allowSelfLoops: false },
    nodes,
    edges
  }
}

/** `wikipedia.json` 的原始形状，与 graphology 的序列化格式并不一致 */
interface WikipediaDataset {
  nodes: { key: string, label: string, tag: string, cluster: string, x: number, y: number, score: number }[]
  edges: [source: string, target: string][]
  clusters: { key: string, color: string, clusterLabel: string }[]
}

/**
 * 加载完整的官方数据集：2085 个节点、5409 条边、24 个社区。
 *
 * 三处换算按上游示例的规则来：颜色取自所属社区（节点自身不带 color），`size` 由
 * `score` 放大而来（节点自身不带 size），`tag` 有一多半是 `"unknown"`、做不了分类字段。
 *
 * 原始坐标跨度 2860 个单位，与本站 360 单位的约定不一致。这里连同 size 一起等比缩放，
 * 视觉比例与上游保持一致——只缩坐标不缩 size，节点会随跨度收缩成倍胀大。
 */
export async function loadWikipediaGraph(): Promise<SerializedGraph> {
  const response = await fetch('/data/wikipedia.json')
  if (!response.ok) {
    throw new Error(`加载 /data/wikipedia.json 失败：HTTP ${response.status}`)
  }

  const dataset = await response.json() as WikipediaDataset
  const clusters = new Map(dataset.clusters.map(cluster => [cluster.key, cluster]))
  const { positions, ratio } = normalize(dataset.nodes)

  const nodes = dataset.nodes.map((node, position) => {
    const cluster = clusters.get(node.cluster)

    return {
      key: node.key,
      attributes: {
        label: node.label,
        category: cluster?.clusterLabel ?? '未分类',
        x: positions[position]!.x,
        y: positions[position]!.y,
        size: (10 + node.score * 1000) * ratio,
        color: cluster?.color ?? '#94a3b8'
      }
    }
  })

  // 原数据集里同一对端点会重复出现，非多重图上必须去重
  const seen = new Set<string>()
  const edges: SerializedGraph['edges'] = []
  for (const [source, target] of dataset.edges) {
    const pair = pairKey(source, target)
    if (seen.has(pair)) {
      continue
    }
    seen.add(pair)
    edges.push({ source, target })
  }

  return {
    attributes: {},
    options: { type: 'mixed', multi: false, allowSelfLoops: false },
    nodes,
    edges
  }
}

function pairKey(source: string, target: string): string {
  return source < target ? `${source}-${target}` : `${target}-${source}`
}

/** 从枢纽出发做 BFS，邻居按度数从高到低入队，子图优先长在骨架上 */
function collectConnected(size: number): string[] {
  const picked = [HUB]
  const seen = new Set(picked)
  const queue = [HUB]

  while (queue.length > 0 && picked.length < size) {
    const current = queue.shift()!
    const ranked = [...NEIGHBORS.get(current)!].sort(
      (a, b) => NODE_BY_KEY.get(b)!.degree - NODE_BY_KEY.get(a)!.degree
    )

    for (const next of ranked) {
      if (picked.length >= size) {
        break
      }
      if (seen.has(next)) {
        continue
      }
      seen.add(next)
      picked.push(next)
      queue.push(next)
    }
  }

  return picked
}

/**
 * 先取一棵 BFS 生成树保证连通，再按 extraEdges 补真实存在的边。
 *
 * 补边只从数据集里取，取尽了就停——这批示例的说服力全在「边是真的」，合成边会把它抵消掉。
 */
function selectEdges(picked: string[], extraEdges: number): [string, string][] {
  const order = new Map(picked.map((key, position) => [key, position]))
  const links: [string, string][] = []
  const used = new Set<string>()

  // picked 是 BFS 顺序，每个节点连到序号最小的那个已入选邻居即得生成树
  for (const key of picked.slice(1)) {
    const parent = NEIGHBORS.get(key)!
      .filter(neighbor => (order.get(neighbor) ?? Number.POSITIVE_INFINITY) < order.get(key)!)
      .sort((a, b) => order.get(a)! - order.get(b)!)[0]

    if (!parent) {
      continue
    }
    used.add(pairKey(key, parent))
    links.push([parent, key])
  }

  if (extraEdges <= 0) {
    return links
  }

  let remaining = picked.length * extraEdges
  for (const [source, target] of EDGES) {
    if (remaining <= 0) {
      break
    }
    if (!order.has(source) || !order.has(target)) {
      continue
    }
    const pair = pairKey(source, target)
    if (used.has(pair)) {
      continue
    }
    used.add(pair)
    links.push([source, target])
    remaining -= 1
  }

  return links
}

/**
 * 把坐标平移缩放到以原点为中心、长边跨度为 SPAN 的方框内。
 *
 * 一并返回缩放比例，供调用方按同一比例缩放 size。
 */
function normalize<T extends { x: number, y: number }>(
  nodes: T[]
): { positions: { x: number, y: number }[], ratio: number } {
  const xs = nodes.map(node => node.x)
  const ys = nodes.map(node => node.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  const extent = Math.max(maxX - minX, maxY - minY) || 1
  const ratio = SPAN / extent
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2

  return {
    ratio,
    positions: nodes.map(node => ({
      x: (node.x - centerX) * ratio,
      y: (node.y - centerY) * ratio
    }))
  }
}

/** 线性同余发生器，确定性伪随机，避免每次刷新图都不一样 */
function createRandom(seed: number): () => number {
  let state = (seed * 2654435761) % 2147483647
  if (state <= 0) {
    state += 2147483646
  }

  return () => {
    state = (state * 16807) % 2147483647
    return (state - 1) / 2147483646
  }
}

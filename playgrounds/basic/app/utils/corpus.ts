import type { SerializedGraph } from 'graphology-types'

/**
 * 示例数据生成器。
 *
 * 组件示例内联自己的数据（数据形状本身就是演示内容），composable 与规模示例
 * 用这里的生成器——那些示例要讲的是行为，数据只是背景板。
 *
 * 本文件随 examples 目录一起搬迁到文档站。
 */

const CATEGORIES = ['管理制度', '技术标准', '操作规程', '应急预案'] as const
const COLORS = ['#f43f5e', '#3b82f6', '#22c55e', '#a855f7'] as const
const RELATIONS = ['引用', '替代', '废止', '依据'] as const

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
 * 坐标按环形铺开，不需要跑布局即可看清结构。
 */
export function demoGraph(options: DemoGraphOptions = {}): SerializedGraph {
  const { nodes: count = 9, extraEdges = 1, multi = false } = options
  const random = createRandom(count * 31 + extraEdges)

  const nodes = Array.from({ length: count }, (_, index) => {
    const bucket = index % CATEGORIES.length
    const angle = (index / count) * Math.PI * 2
    const radius = index === 0 ? 0 : 16

    return {
      key: `n${index}`,
      attributes: {
        label: `${CATEGORIES[bucket]} ${index + 1}`,
        category: CATEGORIES[bucket],
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        size: index === 0 ? 16 : 9 + (index % 3) * 2,
        color: COLORS[bucket]
      }
    }
  })

  const edges: SerializedGraph['edges'] = []

  // 非多重图上同一对端点只能有一条边，随机补边必然撞车，得先去重
  const pairs = new Set<string>()

  function connect(source: number, target: number, label: string) {
    const pair = `${Math.min(source, target)}-${Math.max(source, target)}`
    if (!multi && pairs.has(pair)) {
      return
    }
    pairs.add(pair)
    edges.push({ source: `n${source}`, target: `n${target}`, attributes: { label } })
  }

  // 先连成一棵树，保证连通；再按 extraEdges 补随机边，制造度数差异
  for (let index = 1; index < count; index++) {
    connect(Math.floor(random() * index), index, RELATIONS[index % RELATIONS.length]!)
  }

  for (let index = 0; index < count * extraEdges; index++) {
    const source = Math.floor(random() * count)
    const target = Math.floor(random() * count)
    if (source === target) {
      continue
    }
    connect(source, target, RELATIONS[index % RELATIONS.length]!)
  }

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
 * 度数按幂律分布：新节点优先连到已有的高度数节点，于是 `sampleGraph` 的 Top-N
 * 抽样才有意义——均匀随机图上「取度数最高的 200 个」和随便取 200 个没有区别。
 */
export function createScaleGraph(nodeCount: number, edgeRatio = 3): SerializedGraph {
  const random = createRandom(nodeCount)
  const nodes: SerializedGraph['nodes'] = []
  const edges: SerializedGraph['edges'] = []

  // 优先连接的候选池：节点每被连一次就多一个副本，被选中的概率随度数增长
  const pool: number[] = [0]

  // 优先连接会反复选中同一个高度数节点，非多重图上必须去重
  const pairs = new Set<string>()

  for (let index = 0; index < nodeCount; index++) {
    const angle = random() * Math.PI * 2
    // 越早插入的节点度数越高，把它们摆在靠中心的位置，幂律结构才看得出来；
    // 均匀撒点会得到一团看不出任何结构的圆斑
    const radius = (Math.sqrt(index / nodeCount) * 0.85 + random() * 0.15) * 500

    nodes.push({
      key: `n${index}`,
      attributes: {
        label: `节点 ${index}`,
        category: CATEGORIES[index % CATEGORIES.length],
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        size: 2,
        color: COLORS[index % COLORS.length]
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

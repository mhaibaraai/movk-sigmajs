import type { SerializedGraph, SerializedNode } from 'graphology-types'

/**
 * 服务端持有的制度知识图谱。
 *
 * 与 basic 的生成器刻意不共用：那个是纯随机大图，只为压渲染；这个带业务语义，
 * 并且**在服务端就把 x / y 算好写进节点属性**——架构方案第九节说的「最稳的路径」，
 * 前端跳过布局直接渲染。
 */

export interface CorpusNodeAttributes {
  label: string
  category: string
  x: number
  y: number
  size: number
  color: string
  /** 度数，检索结果排序用 */
  degree: number
}

const CATEGORIES = [
  { name: '管理制度', color: '#f43f5e' },
  { name: '技术标准', color: '#3b82f6' },
  { name: '操作规程', color: '#22c55e' },
  { name: '应急预案', color: '#a855f7' },
  { name: '考核办法', color: '#f59e0b' }
] as const

const RELATIONS = ['引用', '替代', '废止', '依据', '细化'] as const

const DOMAINS = [
  '安全生产', '设备运维', '信息安全', '财务审批', '人力资源',
  '质量控制', '环境保护', '应急响应', '档案管理', '合规审计'
] as const

const NODE_COUNT = 1500
const EDGE_RATIO = 3

/** 线性同余发生器，确定性伪随机，保证每次进程启动拿到同一张图 */
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

function build(): SerializedGraph {
  const random = createRandom(20260724)
  const nodes: SerializedNode[] = []
  const edges: SerializedGraph['edges'] = []
  const degree = new Map<string, number>()

  // 优先连接的候选池：节点每被连一次就多一个副本，形成幂律度分布
  const pool: number[] = [0]

  // 非多重图上同一对端点只能有一条边，优先连接会反复选中同一个高度数节点，必须去重
  const pairs = new Set<string>()

  for (let index = 0; index < NODE_COUNT; index++) {
    const category = CATEGORIES[index % CATEGORIES.length]!
    const domain = DOMAINS[Math.floor(random() * DOMAINS.length)]!

    nodes.push({
      key: `doc-${index}`,
      attributes: {
        label: `${domain}${category.name}（第 ${index + 1} 版）`,
        category: category.name,
        domain,
        x: 0,
        y: 0,
        size: 2,
        color: category.color,
        degree: 0
      }
    })

    if (index === 0) {
      continue
    }

    for (let n = 0; n < EDGE_RATIO; n++) {
      const target = pool[Math.floor(random() * pool.length)]!
      if (target === index) {
        continue
      }

      const pair = `${Math.min(index, target)}-${Math.max(index, target)}`
      if (pairs.has(pair)) {
        continue
      }
      pairs.add(pair)

      const source = `doc-${index}`
      const targetKey = `doc-${target}`

      edges.push({
        key: `rel-${edges.length}`,
        source,
        target: targetKey,
        attributes: { label: RELATIONS[Math.floor(random() * RELATIONS.length)]! }
      })

      degree.set(source, (degree.get(source) ?? 0) + 1)
      degree.set(targetKey, (degree.get(targetKey) ?? 0) + 1)
      pool.push(index, target)
    }
  }

  // 服务端预布局：按分类分扇区、按度数定半径，高度数的排在中心
  const sectors = new Map(CATEGORIES.map((category, index) => [category.name, index]))

  for (const node of nodes) {
    const attributes = node.attributes!
    const nodeDegree = degree.get(String(node.key)) ?? 0
    const sector = sectors.get(attributes.category) ?? 0

    const base = ((sector + 0.5) / CATEGORIES.length) * Math.PI * 2
    const spread = ((Math.PI * 2) / CATEGORIES.length) * 0.8
    const angle = base + (random() - 0.5) * spread
    const radius = (1 - Math.min(1, nodeDegree / 40)) * 380 + random() * 40

    attributes.x = Math.cos(angle) * radius
    attributes.y = Math.sin(angle) * radius
    attributes.size = 2 + Math.min(10, Math.sqrt(nodeDegree) * 1.8)
    attributes.degree = nodeDegree
  }

  return {
    attributes: { name: '文档制度知识图谱' },
    options: { type: 'mixed', multi: false, allowSelfLoops: false },
    nodes,
    edges
  }
}

let cached: SerializedGraph | undefined

/** 整张图，进程内只建一次 */
export function corpus(): SerializedGraph {
  cached ??= build()
  return cached
}

/** 按 key 取节点，找不到返回 undefined */
export function findNode(key: string): SerializedNode | undefined {
  return corpus().nodes.find(node => String(node.key) === key)
}

/** 取给定节点集合诱导出的子图，图级 attributes 与 options 原样保留 */
export function subgraph(keys: Set<string>): SerializedGraph {
  const source = corpus()

  return {
    ...source,
    nodes: source.nodes.filter(node => keys.has(String(node.key))),
    edges: source.edges.filter(edge => keys.has(String(edge.source)) && keys.has(String(edge.target)))
  }
}

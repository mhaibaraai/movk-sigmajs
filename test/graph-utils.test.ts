import Graph from 'graphology'
import { describe, expect, it } from 'vitest'
import { sampleGraph } from '../src/runtime/utils/sample-graph'
import { DEFAULT_COMMUNITY_PALETTE, communityToColor, degreeToSize, degreeToTier, labelPlacements } from '../src/runtime/utils/graph-visual'

/** 星形加一条外围边：hub 度 3，a 与 b 各度 2，c 度 1 */
function starGraph() {
  const graph = new Graph()
  for (const key of ['hub', 'a', 'b', 'c']) {
    graph.addNode(key, { label: key })
  }
  graph.addEdge('hub', 'a')
  graph.addEdge('hub', 'b')
  graph.addEdge('hub', 'c')
  graph.addEdge('a', 'b')
  return graph
}

describe('sampleGraph', () => {
  it('按度数降序取前 N 个节点', () => {
    const result = sampleGraph(starGraph(), 2)
    expect(result.nodes.map(n => n.key).sort()).toEqual(['a', 'hub'])
  })

  it('只保留两端都入选的边', () => {
    const result = sampleGraph(starGraph(), 2)
    // hub-a 两端都在，hub-b / hub-c / a-b 都有一端落选
    expect(result.edges).toHaveLength(1)
    expect([result.edges[0]!.source, result.edges[0]!.target].sort()).toEqual(['a', 'hub'])
  })

  it('size 不小于节点总数时原样返回', () => {
    const graph = starGraph()
    const result = sampleGraph(graph, 99)
    expect(result.nodes).toHaveLength(4)
    expect(result.edges).toHaveLength(4)
  })

  it('保留图级 attributes 与 options', () => {
    const graph = new Graph({ type: 'directed' })
    graph.setAttribute('name', '制度图谱')
    graph.addNode('x')

    const result = sampleGraph(graph, 1)
    expect(result.attributes).toMatchObject({ name: '制度图谱' })
    expect(result.options).toMatchObject({ type: 'directed' })
  })

  it('保留节点属性，结果可直接作为 data 回灌', () => {
    const result = sampleGraph(starGraph(), 1)
    expect(result.nodes[0]!.attributes).toMatchObject({ label: 'hub' })

    const restored = new Graph()
    restored.import(result)
    expect(restored.order).toBe(1)
  })

  it('size 为 0 时返回空节点集', () => {
    const result = sampleGraph(starGraph(), 0)
    expect(result.nodes).toHaveLength(0)
    expect(result.edges).toHaveLength(0)
  })

  it('不改动原图', () => {
    const graph = starGraph()
    sampleGraph(graph, 1)
    expect(graph.order).toBe(4)
    expect(graph.size).toBe(4)
  })
})

describe('degreeToSize', () => {
  it('最高与最低度数分别落在区间两端', () => {
    const sizes = degreeToSize(starGraph(), [4, 20])
    expect(sizes.hub).toBe(20)
    expect(sizes.c).toBe(4)
  })

  it('中间度数按 sqrt 曲线插值', () => {
    // 度数 1..3 映射到 4..20，度 2 归一后 t = 0.5，sqrt 后约 0.707
    const sizes = degreeToSize(starGraph(), [4, 20])
    expect(sizes.a).toBeCloseTo(15.31, 2)
    expect(sizes.b).toBeCloseTo(15.31, 2)
  })

  it('中间度数高于线性映射的结果，叶子节点不至于被钉在下界', () => {
    const sizes = degreeToSize(starGraph(), [4, 20])
    // 线性映射下度 2 落在正中的 12
    expect(sizes.a!).toBeGreaterThan(12)
  })

  it('全图度数相同时统一取区间下界', () => {
    const graph = new Graph()
    graph.addNode('a')
    graph.addNode('b')
    graph.addEdge('a', 'b')

    const sizes = degreeToSize(graph, [6, 18])
    expect(sizes).toEqual({ a: 6, b: 6 })
  })

  it('空图返回空映射', () => {
    expect(degreeToSize(new Graph())).toEqual({})
  })

  it('结果不写回图，size 属性仍为空', () => {
    const graph = starGraph()
    degreeToSize(graph)
    expect(graph.getNodeAttribute('hub', 'size')).toBeUndefined()
  })
})

describe('communityToColor', () => {
  it('同一社区得到同一颜色，不同社区不同色', () => {
    const colors = communityToColor({ a: 0, b: 0, c: 1 })
    expect(colors.a).toBe(colors.b)
    expect(colors.a).not.toBe(colors.c)
  })

  it('社区数超出调色板长度时循环取用', () => {
    const palette = ['#111', '#222']
    expect(communityToColor({ a: 0, b: 1, c: 2, d: 3 }, palette))
      .toEqual({ a: '#111', b: '#222', c: '#111', d: '#222' })
  })

  it('负数编号正确回绕而非落空', () => {
    const palette = ['#111', '#222', '#333']
    expect(communityToColor({ a: -1 }, palette).a).toBe('#333')
  })

  it('默认调色板生效', () => {
    expect(communityToColor({ a: 0 }).a).toBe(DEFAULT_COMMUNITY_PALETTE[0])
  })

  it('调色板为空时返回空映射而非崩溃', () => {
    expect(communityToColor({ a: 0 }, [])).toEqual({})
  })
})

/** 只放一个邻居，用它的方向反推标签该落在哪一侧 */
function placementOf(neighborX: number, neighborY: number) {
  const graph = new Graph()
  graph.addNode('a', { x: 0, y: 0 })
  graph.addNode('n', { x: neighborX, y: neighborY })
  graph.addEdge('a', 'n')

  return labelPlacements(graph).a
}

describe('labelPlacements', () => {
  it('邻居在右则标签甩到左侧', () => {
    expect(placementOf(10, 0)).toBe('left')
  })

  it('邻居在左则标签甩到右侧', () => {
    expect(placementOf(-10, 0)).toBe('right')
  })

  it('图坐标 y 向上，邻居在上方时标签落到下方', () => {
    expect(placementOf(0, 10)).toBe('bottom')
  })

  it('邻居在下方时标签落到上方', () => {
    expect(placementOf(0, -10)).toBe('top')
  })

  it('横向偏置让斜角优先落到上下', () => {
    // 邻居在左下 45 度，横向分量没有超过纵向的 1.6 倍，因此不甩到左右
    expect(placementOf(-10, -10)).toBe('top')
  })

  it('孤立节点取默认方位', () => {
    const graph = new Graph()
    graph.addNode('lonely', { x: 0, y: 0 })

    expect(labelPlacements(graph).lonely).toBe('bottom')
  })

  it('重复调用结果稳定', () => {
    const graph = new Graph()
    graph.addNode('a', { x: 0, y: 0 })
    graph.addNode('b', { x: 5, y: 3 })
    graph.addEdge('a', 'b')

    expect(labelPlacements(graph)).toEqual(labelPlacements(graph))
  })
})

/** 度数随下标单调递减的阈值图，n0 度最高、末位度最低 */
function rankedGraph(size: number) {
  const graph = new Graph()
  for (let i = 0; i < size; i += 1) {
    graph.addNode(`n${i}`)
  }
  for (let i = 0; i < size; i += 1) {
    for (let j = i + 1; j < size - i; j += 1) {
      graph.addEdge(`n${i}`, `n${j}`)
    }
  }
  return graph
}

describe('degreeToTier', () => {
  it('度数最高的节点落进最高档，最低的落进最低档', () => {
    const graph = rankedGraph(10)
    const tiers = degreeToTier(graph)

    expect(tiers.n0).toBe(0)
    expect(tiers.n9).toBe(2)
  })

  it('首档向上取整，保证至少有一个节点', () => {
    const graph = rankedGraph(3)
    const tiers = degreeToTier(graph, { ratios: [0.01, 0.5] })

    expect(Object.values(tiers).filter(tier => tier === 0)).toHaveLength(1)
  })

  it('档位取值不超出 ratios 的段数', () => {
    const tiers = degreeToTier(rankedGraph(20))

    for (const tier of Object.values(tiers)) {
      expect([0, 1, 2]).toContain(tier)
    }
  })

  it('自定义 ratios 决定档位数量', () => {
    const tiers = degreeToTier(rankedGraph(12), { ratios: [0.25] })

    expect(new Set(Object.values(tiers))).toEqual(new Set([0, 1]))
  })

  it('同度数时用 rank 决出先后', () => {
    const graph = new Graph()
    graph.addNode('low', { score: 1 })
    graph.addNode('high', { score: 9 })
    graph.addNode('other')
    graph.addEdge('low', 'other')
    graph.addEdge('high', 'other')

    const tiers = degreeToTier(graph, {
      ratios: [0.34],
      rank: (g, node) => (g.getNodeAttribute(node, 'score') as number) ?? 0
    })

    expect(tiers.high).toBe(0)
    expect(tiers.low).toBe(1)
  })

  it('空图返回空映射而非崩溃', () => {
    expect(degreeToTier(new Graph())).toEqual({})
  })
})

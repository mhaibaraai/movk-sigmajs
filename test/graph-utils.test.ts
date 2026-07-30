import Graph from 'graphology'
import { describe, expect, it } from 'vitest'
import { sampleGraph } from '../src/runtime/utils/sample-graph'
import { DEFAULT_COMMUNITY_PALETTE, communityToColor, degreeToSize } from '../src/runtime/utils/graph-visual'

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

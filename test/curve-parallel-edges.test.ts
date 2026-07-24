import Graph from 'graphology'
import { describe, expect, it } from 'vitest'
import { curveParallelEdges } from '../src/runtime/utils/curve-parallel-edges'

/** 三条 a→b 平行边，外加一条独立的 a→c */
function parallelGraph() {
  const graph = new Graph({ multi: true })
  graph.addNode('a')
  graph.addNode('b')
  graph.addNode('c')
  const parallel = [
    graph.addEdge('a', 'b'),
    graph.addEdge('a', 'b'),
    graph.addEdge('a', 'b')
  ]
  const single = graph.addEdge('a', 'c')
  return { graph, parallel, single }
}

describe('curveParallelEdges', () => {
  it('平行边拿到互不相同的曲率，不再完全重叠', async () => {
    const { graph, parallel } = parallelGraph()

    await curveParallelEdges(graph)

    const curvatures = parallel.map(edge => graph.getEdgeAttribute(edge, 'curvature') as number)
    expect(new Set(curvatures).size).toBe(3)
  })

  it('曲率关于中轴对称，居中那条为 0', async () => {
    const { graph, parallel } = parallelGraph()

    await curveParallelEdges(graph)

    const curvatures = parallel
      .map(edge => graph.getEdgeAttribute(edge, 'curvature') as number)
      .sort((a, b) => a - b)

    expect(curvatures[1]).toBe(0)
    expect(curvatures[0]).toBeCloseTo(-curvatures[2]!, 10)
  })

  it('居中那条走直线程序，两侧走曲线程序', async () => {
    const { graph, parallel } = parallelGraph()

    await curveParallelEdges(graph)

    const types = parallel.map(edge => graph.getEdgeAttribute(edge, 'type'))
    expect(types.filter(t => t === 'straight')).toHaveLength(1)
    expect(types.filter(t => t === 'curved')).toHaveLength(2)
  })

  it('非平行边标为直线', async () => {
    const { graph, single } = parallelGraph()

    await curveParallelEdges(graph)

    expect(graph.getEdgeAttribute(single, 'type')).toBe('straight')
  })

  it('类型名与曲率属性名可自定义', async () => {
    const { graph, parallel, single } = parallelGraph()

    await curveParallelEdges(graph, {
      curvedType: '弧线',
      straightType: '直线',
      curvatureAttribute: 'bend'
    })

    expect(graph.getEdgeAttribute(single, 'type')).toBe('直线')
    expect(graph.getEdgeAttribute(parallel[0]!, 'bend')).toBeTypeOf('number')
    expect(new Set(parallel.map(e => graph.getEdgeAttribute(e, 'type'))))
      .toEqual(new Set(['弧线', '直线']))
  })

  it('曲率有渐近上界，平行边再多也不会失控', async () => {
    const build = async (count: number) => {
      const graph = new Graph({ multi: true })
      graph.addNode('a')
      graph.addNode('b')
      const edges = Array.from({ length: count }, () => graph.addEdge('a', 'b'))
      await curveParallelEdges(graph)
      return Math.max(...edges.map(e => Math.abs(graph.getEdgeAttribute(e, 'curvature') as number)))
    }

    const [few, many, extreme] = [await build(3), await build(11), await build(101)]

    // 指数衰减的上界是 amplitude × DEFAULT_EDGE_CURVATURE = 3.5 × 0.25
    const ceiling = 3.5 * 0.25

    expect(few).toBeLessThan(many)
    expect(many).toBeLessThan(extreme)
    expect(extreme).toBeLessThanOrEqual(ceiling)
    // 边数从 11 涨到 101（9 倍），峰值已几乎贴住上界
    expect(extreme / many).toBeLessThan(1.5)
  })

  it('空图与无边图不抛错', async () => {
    await expect(curveParallelEdges(new Graph())).resolves.toBeUndefined()

    const isolated = new Graph()
    isolated.addNode('lonely')
    await expect(curveParallelEdges(isolated)).resolves.toBeUndefined()
  })
})

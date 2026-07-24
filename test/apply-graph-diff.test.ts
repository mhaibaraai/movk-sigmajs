import Graph from 'graphology'
import type { SerializedGraph } from 'graphology-types'
import { describe, expect, it } from 'vitest'
import { applyGraphDiff } from '../src/runtime/utils/apply-graph-diff'

function serialized(partial: Partial<SerializedGraph>): SerializedGraph {
  return {
    attributes: {},
    options: { type: 'mixed', multi: false, allowSelfLoops: true },
    nodes: [],
    edges: [],
    ...partial
  } as SerializedGraph
}

function seeded() {
  const graph = new Graph()
  graph.addNode('a', { label: 'A', x: 1, y: 2, size: 10 })
  graph.addNode('b', { label: 'B', x: 3, y: 4, size: 10 })
  graph.addEdge('a', 'b', { label: 'a-b' })
  return graph
}

describe('applyGraphDiff', () => {
  it('新数据未给坐标时保留已有 x / y', () => {
    const graph = seeded()

    applyGraphDiff(graph, serialized({
      nodes: [{ key: 'a', attributes: { label: 'A2', size: 20 } }]
    }))

    expect(graph.getNodeAttribute('a', 'x')).toBe(1)
    expect(graph.getNodeAttribute('a', 'y')).toBe(2)
    expect(graph.getNodeAttribute('a', 'label')).toBe('A2')
    expect(graph.getNodeAttribute('a', 'size')).toBe(20)
  })

  it('新数据显式给出坐标时以新值为准', () => {
    const graph = seeded()

    applyGraphDiff(graph, serialized({
      nodes: [{ key: 'a', attributes: { label: 'A', x: 99, y: 88 } }]
    }))

    expect(graph.getNodeAttribute('a', 'x')).toBe(99)
    expect(graph.getNodeAttribute('a', 'y')).toBe(88)
  })

  it('preservePositions 关闭时不回填坐标', () => {
    const graph = seeded()

    applyGraphDiff(graph, serialized({
      nodes: [{ key: 'a', attributes: { label: 'A' } }]
    }), { preservePositions: false })

    expect(graph.getNodeAttribute('a', 'x')).toBeUndefined()
    expect(graph.getNodeAttribute('a', 'y')).toBeUndefined()
  })

  it('默认剪除新数据中不存在的节点与边', () => {
    const graph = seeded()

    applyGraphDiff(graph, serialized({
      nodes: [{ key: 'a', attributes: { label: 'A' } }]
    }))

    expect(graph.nodes()).toEqual(['a'])
    expect(graph.size).toBe(0)
  })

  it('prune 关闭时按增量合入，保留原有节点与边', () => {
    const graph = seeded()

    applyGraphDiff(graph, serialized({
      nodes: [{ key: 'c', attributes: { label: 'C', x: 5, y: 6 } }],
      edges: [{ source: 'b', target: 'c', attributes: { label: 'b-c' } }]
    }), { prune: false })

    expect(graph.nodes().sort()).toEqual(['a', 'b', 'c'])
    expect(graph.size).toBe(2)
    expect(graph.getNodeAttribute('a', 'x')).toBe(1)
  })

  it('同一对端点重复同步不会产生重复边', () => {
    const graph = seeded()
    const data = serialized({
      nodes: [
        { key: 'a', attributes: { label: 'A' } },
        { key: 'b', attributes: { label: 'B' } }
      ],
      edges: [{ source: 'a', target: 'b', attributes: { label: 'a-b' } }]
    })

    applyGraphDiff(graph, data)
    applyGraphDiff(graph, data)

    expect(graph.size).toBe(1)
  })

  it('显式 key 的边按 key 定位并更新属性', () => {
    const graph = new Graph()
    graph.addNode('a')
    graph.addNode('b')
    graph.addEdgeWithKey('e1', 'a', 'b', { label: '旧' })

    applyGraphDiff(graph, serialized({
      nodes: [{ key: 'a', attributes: {} }, { key: 'b', attributes: {} }],
      edges: [{ key: 'e1', source: 'a', target: 'b', attributes: { label: '新' } }]
    }))

    expect(graph.size).toBe(1)
    expect(graph.getEdgeAttribute('e1', 'label')).toBe('新')
  })

  it('节点属性按新数据整体替换，不残留旧字段', () => {
    const graph = seeded()

    applyGraphDiff(graph, serialized({
      nodes: [{ key: 'a', attributes: { label: 'A' } }]
    }))

    expect(graph.getNodeAttribute('a', 'size')).toBeUndefined()
  })
})

describe('applyGraphDiff 端点缺失的边', () => {
  it('跳过端点不在图中的边，不抛错', () => {
    const graph = new Graph()
    graph.addNode('a')

    expect(() => applyGraphDiff(graph, serialized({
      nodes: [{ key: 'a', attributes: {} }],
      edges: [{ source: 'a', target: '尚未加载', attributes: {} }]
    }), { prune: false })).not.toThrow()

    expect(graph.size).toBe(0)
    expect(graph.order).toBe(1)
  })

  it('端点齐备的边照常创建', () => {
    const graph = new Graph()

    applyGraphDiff(graph, serialized({
      nodes: [{ key: 'a', attributes: {} }, { key: 'b', attributes: {} }],
      edges: [
        { source: 'a', target: 'b', attributes: {} },
        { source: 'a', target: '缺失', attributes: {} }
      ]
    }))

    expect(graph.size).toBe(1)
  })
})

describe('applyGraphDiff 与多重图', () => {
  it('多重图上无 key 的平行边不会被压成一条', () => {
    const graph = new Graph({ multi: true })

    applyGraphDiff(graph, serialized({
      nodes: [{ key: 'a', attributes: {} }, { key: 'b', attributes: {} }],
      edges: [
        { source: 'a', target: 'b', attributes: { label: '引用' } },
        { source: 'a', target: 'b', attributes: { label: '废止' } },
        { source: 'a', target: 'b', attributes: { label: '替代' } }
      ]
    }))

    expect(graph.size).toBe(3)
  })

  it('非多重图仍按端点匹配，重复同步不会累积', () => {
    const graph = new Graph()
    const data = serialized({
      nodes: [{ key: 'a', attributes: {} }, { key: 'b', attributes: {} }],
      edges: [{ source: 'a', target: 'b', attributes: { label: '引用' } }]
    })

    applyGraphDiff(graph, data)
    applyGraphDiff(graph, data)

    expect(graph.size).toBe(1)
  })

  it('多重图上带 key 的边可重复同步而不累积', () => {
    const graph = new Graph({ multi: true })
    const data = serialized({
      nodes: [{ key: 'a', attributes: {} }, { key: 'b', attributes: {} }],
      edges: [
        { key: 'e1', source: 'a', target: 'b', attributes: { label: '引用' } },
        { key: 'e2', source: 'a', target: 'b', attributes: { label: '废止' } }
      ]
    })

    applyGraphDiff(graph, data)
    applyGraphDiff(graph, data)

    expect(graph.size).toBe(2)
    expect(graph.getEdgeAttribute('e2', 'label')).toBe('废止')
  })
})

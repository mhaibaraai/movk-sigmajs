import Graph from 'graphology'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { SerializedGraph } from 'graphology-types'
import SigmaGraph from '../src/runtime/components/Graph.vue'
import { useSigmaNeighborhood } from '../src/runtime/composables/use-sigma-neighborhood'
import type { UseSigmaNeighborhoodOptions, UseSigmaNeighborhoodReturn } from '../src/runtime/composables/use-sigma-neighborhood'

const state = vi.hoisted(() => ({ ready: [] as unknown[] }))

vi.mock('sigma', () => {
  class MockSigma {
    constructor() {
      state.ready.push(this)
    }

    on() {}
    off() {}
    resize() {}
    kill() {}
    setGraph() {}
    refresh() {}
    setSettings() {}
    getSettings() {
      return {}
    }
  }

  return { default: MockSigma }
})

/** a — b — c — d 链，外加与 a 相连的 hub */
function chainGraph() {
  const graph = new Graph()
  for (const key of ['a', 'b', 'c', 'd', 'hub']) {
    graph.addNode(key)
  }
  graph.addEdge('a', 'b')
  graph.addEdge('b', 'c')
  graph.addEdge('c', 'd')
  graph.addEdge('a', 'hub')
  return graph
}

function serialized(partial: Partial<SerializedGraph>): SerializedGraph {
  return {
    attributes: {},
    options: { type: 'mixed', multi: false, allowSelfLoops: true },
    nodes: [],
    edges: [],
    ...partial
  } as SerializedGraph
}

async function mountNeighborhood(graph: Graph, options: UseSigmaNeighborhoodOptions = {}) {
  let api!: UseSigmaNeighborhoodReturn

  const Child = defineComponent({
    setup() {
      api = useSigmaNeighborhood(options)
      return () => h('span')
    }
  })

  const wrapper = mount(SigmaGraph, {
    props: { graph } as never,
    slots: { default: () => h(Child) }
  })

  await vi.waitFor(() => {
    if (!wrapper.vm.sigma) {
      throw new Error('sigma 尚未就绪')
    }
  })

  return api
}

enableAutoUnmount(afterEach)

beforeEach(() => {
  state.ready.length = 0
})

describe('useSigmaNeighborhood', () => {
  it('一度邻域含节点自身与直接邻居', async () => {
    const api = await mountNeighborhood(chainGraph())
    expect([...api.neighborhood('a')].sort()).toEqual(['a', 'b', 'hub'])
  })

  it('深度逐层扩散', async () => {
    const api = await mountNeighborhood(chainGraph())

    expect([...api.neighborhood('a', 2)].sort()).toEqual(['a', 'b', 'c', 'hub'])
    expect([...api.neighborhood('a', 3)].sort()).toEqual(['a', 'b', 'c', 'd', 'hub'])
  })

  it('深度超过图直径时收敛，不会无限扩散', async () => {
    const api = await mountNeighborhood(chainGraph())
    expect(api.neighborhood('a', 99).size).toBe(5)
  })

  it('深度为 0 时只有节点自身', async () => {
    const api = await mountNeighborhood(chainGraph())
    expect([...api.neighborhood('a', 0)]).toEqual(['a'])
  })

  it('节点不存在时返回空集', async () => {
    const api = await mountNeighborhood(chainGraph())
    expect(api.neighborhood('missing').size).toBe(0)
  })

  it('默认深度取自选项', async () => {
    const api = await mountNeighborhood(chainGraph(), { depth: 2 })
    expect([...api.neighborhood('a')].sort()).toEqual(['a', 'b', 'c', 'hub'])
  })

  it('有向图上同时沿出入两侧扩散', async () => {
    const graph = new Graph({ type: 'directed' })
    graph.addNode('a')
    graph.addNode('out')
    graph.addNode('in')
    graph.addEdge('a', 'out')
    graph.addEdge('in', 'a')

    const api = await mountNeighborhood(graph)
    expect([...api.neighborhood('a')].sort()).toEqual(['a', 'in', 'out'])
  })

  it('邻域边集只含两端都在邻域内的边', async () => {
    const graph = chainGraph()
    const api = await mountNeighborhood(graph)

    const edges = api.neighborhoodEdges('a')

    expect(edges.has(graph.edge('a', 'b')!)).toBe(true)
    expect(edges.has(graph.edge('a', 'hub')!)).toBe(true)
    // b—c 的另一端不在一度邻域内
    expect(edges.has(graph.edge('b', 'c')!)).toBe(false)
  })

  it('expand 增量合入远端数据且保留既有坐标', async () => {
    const graph = new Graph()
    graph.addNode('a', { label: 'A', x: 3, y: 4 })

    const api = await mountNeighborhood(graph)

    await api.expand('a', async () => serialized({
      nodes: [
        { key: 'a', attributes: { label: 'A' } },
        { key: 'new', attributes: { label: 'NEW', x: 1, y: 1 } }
      ],
      edges: [{ source: 'a', target: 'new', attributes: {} }]
    }))

    expect(graph.order).toBe(2)
    expect(graph.getNodeAttribute('a', 'x')).toBe(3)
    expect(graph.getNodeAttribute('a', 'y')).toBe(4)
    expect(api.expanded.value.has('a')).toBe(true)
  })

  it('expand 不会剪除远端未返回的既有节点', async () => {
    const graph = chainGraph()
    const api = await mountNeighborhood(graph)

    await api.expand('a', async () => serialized({
      nodes: [{ key: 'extra', attributes: {} }]
    }))

    expect(graph.order).toBe(6)
  })

  it('expand 期间 isExpanding 为真，失败后复位且不记录', async () => {
    const api = await mountNeighborhood(chainGraph())

    await expect(api.expand('a', async () => {
      throw new Error('网络错误')
    })).rejects.toThrow('网络错误')

    expect(api.isExpanding.value).toBe(false)
    expect(api.expanded.value.has('a')).toBe(false)
  })

  it('reset 清空展开记录', async () => {
    const api = await mountNeighborhood(chainGraph())

    await api.expand('a', async () => serialized({}))
    api.reset()

    expect(api.expanded.value.size).toBe(0)
  })
})

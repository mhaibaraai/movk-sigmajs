import Graph from 'graphology'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import SigmaGraph from '../src/runtime/components/Graph.vue'
import { useSigmaMetrics } from '../src/runtime/composables/use-sigma-metrics'
import type { UseSigmaMetricsReturn } from '../src/runtime/composables/use-sigma-metrics'

vi.mock('sigma', () => {
  class MockSigma {
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

/** hub 连着三个叶子，leaf1 与 leaf2 之间另有一条边 */
function seeded() {
  const graph = new Graph()
  for (const key of ['hub', 'leaf1', 'leaf2', 'leaf3']) {
    graph.addNode(key)
  }
  graph.addEdge('hub', 'leaf1')
  graph.addEdge('hub', 'leaf2')
  graph.addEdge('hub', 'leaf3')
  graph.addEdge('leaf1', 'leaf2')
  return graph
}

async function mountMetrics() {
  let api!: UseSigmaMetricsReturn

  const Child = defineComponent({
    setup() {
      api = useSigmaMetrics()
      return () => h('span')
    }
  })

  const graph = seeded()
  const wrapper = mount(SigmaGraph, {
    props: { graph } as never,
    slots: { default: () => h(Child) }
  })

  await vi.waitFor(() => {
    if (!wrapper.vm.sigma) {
      throw new Error('sigma 尚未就绪')
    }
  })

  return { api, graph }
}

enableAutoUnmount(afterEach)

describe('useSigmaMetrics', () => {
  it('度数用核心 graphology 计算，无需额外依赖', async () => {
    const { api } = await mountMetrics()

    expect(api.degrees.value).toEqual({ hub: 3, leaf1: 2, leaf2: 2, leaf3: 1 })
    expect(api.maxDegree.value).toBe(3)
  })

  it('空图的最大度数为 0', async () => {
    let api!: UseSigmaMetricsReturn
    const Child = defineComponent({
      setup() {
        api = useSigmaMetrics()
        return () => h('span')
      }
    })

    const wrapper = mount(SigmaGraph, {
      props: { graph: new Graph() } as never,
      slots: { default: () => h(Child) }
    })
    await vi.waitFor(() => {
      if (!wrapper.vm.sigma) {
        throw new Error('sigma 尚未就绪')
      }
    })

    expect(api.maxDegree.value).toBe(0)
  })

  it('图变更后度数重算', async () => {
    const { api, graph } = await mountMetrics()

    graph.addNode('extra')
    graph.addEdge('hub', 'extra')
    await nextTick()

    expect(api.degrees.value.hub).toBe(4)
    expect(api.maxDegree.value).toBe(4)
  })

  it('centrality 默认返回度数', async () => {
    const { api } = await mountMetrics()
    await expect(api.centrality()).resolves.toEqual(api.degrees.value)
  })

  it('betweenness 中心性透传上游结果', async () => {
    // 用链状图断言：graphology-metrics@2.4.0 在链上结果正确，
    // 但分叉节点会偏低、首个插入的节点恒为 0（4 节点星形的星心得 0，正确值是 3）。
    // 这里只验证本层封装把图正确交出去并把结果原样返回，不替上游背书
    let api!: UseSigmaMetricsReturn
    const Child = defineComponent({
      setup() {
        api = useSigmaMetrics()
        return () => h('span')
      }
    })

    const chain = new Graph()
    for (const key of ['a', 'b', 'c', 'd', 'e']) {
      chain.addNode(key)
    }
    chain.addEdge('a', 'b')
    chain.addEdge('b', 'c')
    chain.addEdge('c', 'd')
    chain.addEdge('d', 'e')

    const wrapper = mount(SigmaGraph, {
      props: { graph: chain } as never,
      slots: { default: () => h(Child) }
    })
    await vi.waitFor(() => {
      if (!wrapper.vm.sigma) {
        throw new Error('sigma 尚未就绪')
      }
    })

    const result = await api.centrality('betweenness')

    expect(result.c).toBeGreaterThan(result.b!)
    expect(result.a).toBe(0)
  })

  it('closeness 中心性可用', async () => {
    const { api } = await mountMetrics()

    const result = await api.centrality('closeness')

    expect(Object.keys(result).sort()).toEqual(['hub', 'leaf1', 'leaf2', 'leaf3'])
  })

  it('同一图版本下重复调用命中缓存，返回同一对象', async () => {
    const { api } = await mountMetrics()

    const first = await api.centrality('betweenness')
    const second = await api.centrality('betweenness')

    expect(second).toBe(first)
  })

  it('图变更后缓存失效，重新计算', async () => {
    const { api, graph } = await mountMetrics()

    const first = await api.centrality('betweenness')
    graph.addNode('extra')
    await nextTick()
    const second = await api.centrality('betweenness')

    expect(second).not.toBe(first)
  })

  it('Louvain 社区划分覆盖全部节点', async () => {
    const { api } = await mountMetrics()

    const communities = await api.communities()

    expect(Object.keys(communities).sort()).toEqual(['hub', 'leaf1', 'leaf2', 'leaf3'])
    expect(Object.values(communities).every(v => typeof v === 'number')).toBe(true)
  })
})

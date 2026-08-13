import Graph from 'graphology'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import SigmaGraph from '../src/runtime/components/Graph.vue'
import { useSigmaFilter } from '../src/runtime/composables/use-sigma-filter'
import type { UseSigmaFilterOptions, UseSigmaFilterReturn } from '../src/runtime/composables/use-sigma-filter'

const state = vi.hoisted(() => ({
  instances: [] as Array<{ options: Record<string, unknown>, settings: Record<string, unknown> }>
}))

vi.mock('sigma', () => {
  class MockSigma {
    options: Record<string, unknown>
    settings: Record<string, unknown>
    constructor(_graph: unknown, _container: unknown, options: { settings: Record<string, unknown> }) {
      this.options = options
      this.settings = options.settings
      state.instances.push(this)
    }

    on() {}
    off() {}
    resize() {}
    kill() {}
    setGraph() {}
    refresh() {}
    getGraphState() {
      return { hasHighlighted: false, hasHovered: false, isIdle: true }
    }

    setSettings(next: Record<string, unknown>) {
      this.settings = next
    }

    getSettings() {
      return this.settings
    }
  }

  return { default: MockSigma }
})

type Reducer = (...args: unknown[]) => Record<string, unknown>

function seeded() {
  const graph = new Graph()
  graph.addNode('keep', { group: 'a' })
  graph.addNode('drop', { group: 'b' })
  graph.addNode('other', { group: 'a' })
  graph.addEdge('keep', 'other', { kind: 'x' })
  graph.addEdge('keep', 'drop', { kind: 'y' })
  return graph
}

async function mountFilter(options: UseSigmaFilterOptions = {}) {
  let api!: UseSigmaFilterReturn

  const Child = defineComponent({
    setup() {
      api = useSigmaFilter(options)
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

  const instance = state.instances[0]!
  return {
    api,
    graph,
    nodeReducer: () => {
      const reducer = instance.options.nodeReducer as Reducer
      return (key: string, data: Record<string, unknown> = {}) => reducer(key, data, {}, {}, {}, {})
    },
    edgeReducer: () => {
      const reducer = instance.options.edgeReducer as Reducer
      return (key: string, data: Record<string, unknown> = {}) => reducer(key, data, {}, {}, {}, {})
    }
  }
}

enableAutoUnmount(afterEach)

beforeEach(() => {
  state.instances.length = 0
})

describe('useSigmaFilter', () => {
  it('无过滤时不隐藏任何节点', async () => {
    const { api, nodeReducer } = await mountFilter()

    expect(api.hiddenCount.value).toBe(0)
    expect(nodeReducer()('drop', { size: 1 })).not.toMatchObject({ opacity: 0 })
  })

  it('节点谓词返回 false 的被隐藏', async () => {
    const { api, nodeReducer } = await mountFilter()

    api.nodeFilter.value = (_key, attributes) => attributes.group === 'a'
    await nextTick()

    expect(nodeReducer()('keep', {})).not.toMatchObject({ opacity: 0 })
    expect(nodeReducer()('drop', {})).toMatchObject({ color: 'transparent', opacity: 0, labelVisibility: 'hidden' })
    expect(api.hiddenCount.value).toBe(1)
  })

  it('隐藏节点不产出 visibility 字段', async () => {
    // sigma v4-beta 的 GPU index-0 碰撞缺陷靠 visibility:'hidden' 触发，见
    // use-sigma-filter.ts 顶部注释；这条断言防止将来有人手滑改回去
    const { api, nodeReducer } = await mountFilter()

    api.nodeFilter.value = () => false
    await nextTick()

    expect(nodeReducer()('drop', {})).not.toHaveProperty('visibility')
  })

  it('only 只保留给定节点', async () => {
    const { api, nodeReducer } = await mountFilter()

    api.only(['keep'])
    await nextTick()

    expect(nodeReducer()('keep', {})).not.toMatchObject({ opacity: 0 })
    expect(nodeReducer()('other', {})).toMatchObject({ color: 'transparent', opacity: 0, labelVisibility: 'hidden' })
    expect(api.hiddenCount.value).toBe(2)
  })

  it('端点被隐藏时边一并隐藏', async () => {
    const { api, graph, edgeReducer } = await mountFilter()

    api.only(['keep', 'other'])
    await nextTick()

    expect(edgeReducer()(graph.edge('keep', 'other')!, {})).not.toMatchObject({ opacity: 0 })
    expect(edgeReducer()(graph.edge('keep', 'drop')!, {})).toMatchObject({ color: 'transparent', opacity: 0, labelVisibility: 'hidden' })
  })

  it('hideDanglingEdges 关闭后边不随端点隐藏', async () => {
    const { api, graph, edgeReducer } = await mountFilter({ hideDanglingEdges: false })

    api.only(['keep'])
    await nextTick()

    expect(edgeReducer()(graph.edge('keep', 'drop')!, {})).not.toMatchObject({ opacity: 0 })
  })

  it('边谓词独立生效', async () => {
    const { api, graph, edgeReducer } = await mountFilter()

    api.edgeFilter.value = (_key, attributes) => attributes.kind === 'x'
    await nextTick()

    expect(edgeReducer()(graph.edge('keep', 'other')!, {})).not.toMatchObject({ opacity: 0 })
    expect(edgeReducer()(graph.edge('keep', 'drop')!, {})).toMatchObject({ color: 'transparent', opacity: 0, labelVisibility: 'hidden' })
  })

  it('reset 清空全部过滤', async () => {
    const { api, nodeReducer } = await mountFilter()

    api.only(['keep'])
    await nextTick()
    api.reset()
    await nextTick()

    expect(api.hiddenCount.value).toBe(0)
    expect(nodeReducer()('drop', {})).not.toMatchObject({ opacity: 0 })
  })

  it('过滤只作用于视图，不改动图数据', async () => {
    const { api, graph } = await mountFilter()

    api.only(['keep'])
    await nextTick()

    expect(graph.order).toBe(3)
    expect(graph.hasNode('drop')).toBe(true)
  })
})

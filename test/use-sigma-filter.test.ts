import Graph from 'graphology'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import SigmaGraph from '../src/runtime/components/Graph.vue'
import { useSigmaFilter } from '../src/runtime/composables/use-sigma-filter'
import type { UseSigmaFilterOptions, UseSigmaFilterReturn } from '../src/runtime/composables/use-sigma-filter'

interface ItemState { isHidden?: boolean }

const state = vi.hoisted(() => ({
  instances: [] as Array<{
    nodeStates: Map<string, ItemState>
    edgeStates: Map<string, ItemState>
  }>
}))

vi.mock('sigma', () => {
  class MockSigma {
    options: Record<string, unknown>
    settings: Record<string, unknown>
    nodeStates = new Map<string, ItemState>()
    edgeStates = new Map<string, ItemState>()

    constructor(_graph: unknown, _container: unknown, options: { settings: Record<string, unknown> }) {
      this.options = options
      this.settings = options.settings
      state.instances.push(this)
    }

    setNodesState(keys: string[], patch: ItemState) {
      for (const key of keys) {
        this.nodeStates.set(key, { ...this.nodeStates.get(key), ...patch })
      }
    }

    setNodeState(key: string, patch: ItemState) {
      this.setNodesState([key], patch)
    }

    setEdgesState(keys: string[], patch: ItemState) {
      for (const key of keys) {
        this.edgeStates.set(key, { ...this.edgeStates.get(key), ...patch })
      }
    }

    setEdgeState(key: string, patch: ItemState) {
      this.setEdgesState([key], patch)
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
    isNodeHidden: (key: string) => instance.nodeStates.get(key)?.isHidden === true,
    isEdgeHidden: (key: string) => instance.edgeStates.get(key)?.isHidden === true
  }
}

enableAutoUnmount(afterEach)

beforeEach(() => {
  state.instances.length = 0
})

describe('useSigmaFilter', () => {
  it('无过滤时不隐藏任何节点', async () => {
    const { api, isNodeHidden } = await mountFilter()

    expect(api.hiddenCount.value).toBe(0)
    expect(isNodeHidden('drop')).toBe(false)
  })

  it('节点谓词返回 false 的写入 isHidden 状态', async () => {
    const { api, isNodeHidden } = await mountFilter()

    api.nodeFilter.value = (_key, attributes) => attributes.group === 'a'
    await nextTick()

    expect(isNodeHidden('keep')).toBe(false)
    expect(isNodeHidden('drop')).toBe(true)
    expect(api.hiddenCount.value).toBe(1)
  })

  it('only 只保留给定节点', async () => {
    const { api, isNodeHidden } = await mountFilter()

    api.only(['keep'])
    await nextTick()

    expect(isNodeHidden('keep')).toBe(false)
    expect(isNodeHidden('other')).toBe(true)
    expect(api.hiddenCount.value).toBe(2)
  })

  it('端点被隐藏时边一并隐藏', async () => {
    const { api, graph, isEdgeHidden } = await mountFilter()

    api.only(['keep', 'other'])
    await nextTick()

    expect(isEdgeHidden(graph.edge('keep', 'other')!)).toBe(false)
    expect(isEdgeHidden(graph.edge('keep', 'drop')!)).toBe(true)
  })

  it('hideDanglingEdges 关闭后边不随端点隐藏', async () => {
    const { api, graph, isEdgeHidden } = await mountFilter({ hideDanglingEdges: false })

    api.only(['keep'])
    await nextTick()

    expect(isEdgeHidden(graph.edge('keep', 'drop')!)).toBe(false)
  })

  it('边谓词独立生效', async () => {
    const { api, graph, isEdgeHidden } = await mountFilter()

    api.edgeFilter.value = (_key, attributes) => attributes.kind === 'x'
    await nextTick()

    expect(isEdgeHidden(graph.edge('keep', 'other')!)).toBe(false)
    expect(isEdgeHidden(graph.edge('keep', 'drop')!)).toBe(true)
  })

  it('reset 清空全部过滤并撤回 isHidden', async () => {
    const { api, isNodeHidden } = await mountFilter()

    api.only(['keep'])
    await nextTick()
    api.reset()
    await nextTick()

    expect(api.hiddenCount.value).toBe(0)
    expect(isNodeHidden('drop')).toBe(false)
  })

  it('过滤只作用于视图，不改动图数据', async () => {
    const { api, graph } = await mountFilter()

    api.only(['keep'])
    await nextTick()

    expect(graph.order).toBe(3)
    expect(graph.hasNode('drop')).toBe(true)
  })
})

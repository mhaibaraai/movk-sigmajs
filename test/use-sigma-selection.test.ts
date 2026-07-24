import Graph from 'graphology'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import SigmaGraph from '../src/runtime/components/Graph.vue'
import { useSigmaSelection } from '../src/runtime/composables/use-sigma-selection'
import type { UseSigmaSelectionOptions, UseSigmaSelectionReturn } from '../src/runtime/composables/use-sigma-selection'

const state = vi.hoisted(() => ({
  instances: [] as Array<{ settings: Record<string, unknown>, handlers: Record<string, (payload: unknown) => void> }>
}))

vi.mock('sigma', () => {
  class MockSigma {
    settings: Record<string, unknown>
    handlers: Record<string, (payload: unknown) => void> = {}
    constructor(_graph: unknown, _container: unknown, settings: Record<string, unknown>) {
      this.settings = settings
      state.instances.push(this)
    }

    on(event: string, handler: (payload: unknown) => void) {
      this.handlers[event] = handler
    }

    off() {}
    resize() {}
    kill() {}
    setGraph() {}
    refresh() {}
    setSettings(next: Record<string, unknown>) {
      this.settings = next
    }

    getSettings() {
      return this.settings
    }
  }

  return { default: MockSigma }
})

type Reducer = (key: string, data: Record<string, unknown>) => Record<string, unknown>

function seededGraph() {
  const graph = new Graph()
  graph.addNode('a', { label: 'A' })
  graph.addNode('b', { label: 'B' })
  graph.addNode('far', { label: 'FAR' })
  graph.addEdge('a', 'b')
  graph.addEdge('b', 'far')
  return graph
}

async function mountSelection(options: UseSigmaSelectionOptions = {}) {
  let api!: UseSigmaSelectionReturn

  const Child = defineComponent({
    setup() {
      api = useSigmaSelection(options)
      return () => h('span')
    }
  })

  const graph = seededGraph()
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
    emit: (event: string, payload: unknown) => instance.handlers[event]?.(payload),
    nodeReducer: () => instance.settings.nodeReducer as Reducer | null,
    edgeReducer: () => instance.settings.edgeReducer as Reducer | null
  }
}

enableAutoUnmount(afterEach)

beforeEach(() => {
  state.instances.length = 0
})

describe('useSigmaSelection', () => {
  it('悬浮进入与离开更新 hovered', async () => {
    const { api, emit } = await mountSelection()

    emit('enterNode', { node: 'a' })
    expect(api.hovered.value).toBe('a')

    emit('leaveNode', { node: 'a' })
    expect(api.hovered.value).toBeNull()
  })

  it('点击选中，再次点击同一节点取消', async () => {
    const { api, emit } = await mountSelection()

    emit('clickNode', { node: 'a' })
    expect(api.selected.value).toBe('a')

    emit('clickNode', { node: 'a' })
    expect(api.selected.value).toBeNull()
  })

  it('点击空白处清空选中', async () => {
    const { api, emit } = await mountSelection()

    emit('clickNode', { node: 'a' })
    emit('clickStage', {})

    expect(api.selected.value).toBeNull()
  })

  it('选中优先于悬浮决定焦点', async () => {
    const { api, emit } = await mountSelection()

    emit('enterNode', { node: 'b' })
    emit('clickNode', { node: 'a' })

    expect(api.focused.value).toBe('a')
  })

  it('高亮集合含焦点节点及其直接邻居', async () => {
    const { api } = await mountSelection()

    api.select('a')

    expect([...api.highlighted.value].sort()).toEqual(['a', 'b'])
  })

  it('无焦点时归约不改动任何节点', async () => {
    const { nodeReducer } = await mountSelection()

    expect(nodeReducer()!('far', { label: 'FAR', color: '#111' })).toMatchObject({ label: 'FAR', color: '#111' })
  })

  it('有焦点时无关节点被淡出且隐藏标签', async () => {
    const { api, nodeReducer } = await mountSelection({ dimColor: '#eee' })

    api.select('a')

    expect(nodeReducer()!('a', {})).toMatchObject({ highlighted: true })
    expect(nodeReducer()!('b', { label: 'B' })).toMatchObject({ label: 'B' })
    expect(nodeReducer()!('far', { label: 'FAR' })).toMatchObject({ color: '#eee', label: null })
  })

  it('dim 关闭时不淡出，只标记焦点', async () => {
    const { api, nodeReducer } = await mountSelection({ dim: false })

    api.select('a')

    expect(nodeReducer()!('far', { label: 'FAR', color: '#111' })).toMatchObject({ color: '#111', label: 'FAR' })
  })

  it('与焦点相连的边保留，其余淡出', async () => {
    const { api, graph, edgeReducer } = await mountSelection({ dimColor: '#eee' })

    api.select('a')

    const incident = graph.edge('a', 'b')!
    const remote = graph.edge('b', 'far')!

    expect(edgeReducer()!(incident, { label: 'e' })).toMatchObject({ label: 'e' })
    expect(edgeReducer()!(remote, { label: 'e' })).toMatchObject({ color: '#eee', label: null })
  })

  it('clear 同时清空悬浮与选中', async () => {
    const { api, emit } = await mountSelection()

    emit('enterNode', { node: 'a' })
    api.select('b')
    api.clear()

    expect(api.hovered.value).toBeNull()
    expect(api.selected.value).toBeNull()
    expect(api.focused.value).toBeNull()
  })

  it('hover 与 click 关闭后不响应对应事件', async () => {
    const { api, emit } = await mountSelection({ hover: false, click: false })

    emit('enterNode', { node: 'a' })
    emit('clickNode', { node: 'a' })

    expect(api.hovered.value).toBeNull()
    expect(api.selected.value).toBeNull()
  })
})

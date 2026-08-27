import Graph from 'graphology'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import SigmaGraph from '../src/runtime/components/Graph.vue'
import { useSigmaSelection } from '../src/runtime/composables/use-sigma-selection'
import type { UseSigmaSelectionOptions, UseSigmaSelectionReturn } from '../src/runtime/composables/use-sigma-selection'

type ItemState = { isHighlighted?: boolean }
const BASE_NODE_STATE = {
  isHovered: false,
  isLabelHovered: false,
  isHidden: false,
  isHighlighted: false,
  isDragged: false
}

const BASE_EDGE_STATE = {
  isHovered: false,
  isLabelHovered: false,
  isHidden: false,
  isHighlighted: false,
  parallelIndex: 0,
  parallelCount: 1
}

const BASE_GRAPH_STATE = {
  isIdle: true,
  isPanning: false,
  isZooming: false,
  isDragging: false,
  hasHovered: false,
  hasHighlighted: false
}

/**
 * v4 把交互状态存在 sigma 内部，reducer 每次调用时收到对应条目的 state 与图级
 * graphState。mock 必须真的维护这份状态，否则「读 state 做淡出」的行为无从验证
 */
const state = vi.hoisted(() => ({
  instances: [] as Array<{
    options: Record<string, unknown>
    handlers: Record<string, (payload: unknown) => void>
    nodeStates: Map<string, ItemState>
    edgeStates: Map<string, ItemState>
    getGraphState: () => Record<string, boolean>
  }>
}))

vi.mock('sigma', () => {
  class MockSigma {
    options: Record<string, unknown>
    handlers: Record<string, (payload: unknown) => void> = {}
    nodeStates = new Map<string, ItemState>()
    edgeStates = new Map<string, ItemState>()

    constructor(_graph: unknown, _container: unknown, options: Record<string, unknown>) {
      this.options = options
      state.instances.push(this)
    }

    on(event: string, handler: (payload: unknown) => void) {
      this.handlers[event] = handler
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

    getGraphState() {
      const anyHighlighted = [...this.nodeStates.values(), ...this.edgeStates.values()]
        .some(item => item.isHighlighted)

      return { hasHighlighted: anyHighlighted, hasHovered: false, isIdle: true }
    }

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

  /** 按 sigma 的方式跑一次真实的 styles 求值：带上该条目当前的 state 与图级状态 */
  async function runNode(key: string, attributes: Record<string, unknown> = {}) {
    const { evaluateNodeStyle } = await import('sigma/types')
    const styles = instance.options.styles as { nodes: Record<string, unknown>[] }
    const itemState = { ...BASE_NODE_STATE, ...instance.nodeStates.get(key) }
    return evaluateNodeStyle(styles.nodes, { x: 0, y: 0, ...attributes }, itemState, graphState(), graph)
  }

  async function runEdge(key: string, attributes: Record<string, unknown> = {}) {
    const { evaluateEdgeStyle } = await import('sigma/types')
    const styles = instance.options.styles as { edges: Record<string, unknown>[] }
    const itemState = { ...BASE_EDGE_STATE, ...instance.edgeStates.get(key) }
    return evaluateEdgeStyle(styles.edges, attributes, itemState, graphState(), graph)
  }

  function graphState() {
    return { ...BASE_GRAPH_STATE, ...instance.getGraphState() }
  }

  /** 焦点变化经 watch 落到状态，断言前要等一拍 */
  async function select(key: string | null) {
    api.select(key)
    await nextTick()
  }

  return {
    api,
    graph,
    instance,
    select,
    runNode,
    runEdge,
    emit: (event: string, payload: unknown) => instance.handlers[event]?.(payload)
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
    const { api, select } = await mountSelection()

    await select('a')

    expect([...api.highlighted.value].sort()).toEqual(['a', 'b'])
  })

  it('焦点及邻居被写入 isHighlighted 状态', async () => {
    const { instance, select } = await mountSelection()

    await select('a')

    expect(instance.nodeStates.get('a')).toMatchObject({ isHighlighted: true })
    expect(instance.nodeStates.get('b')).toMatchObject({ isHighlighted: true })
    expect(instance.nodeStates.get('far')?.isHighlighted).toBeFalsy()
  })

  it('焦点转移时清除上一次的高亮状态', async () => {
    const { instance, select } = await mountSelection()

    await select('a')
    await select('far')

    expect(instance.nodeStates.get('a')).toMatchObject({ isHighlighted: false })
    expect(instance.nodeStates.get('far')).toMatchObject({ isHighlighted: true })
  })

  it('无焦点时 styles 不改动任何节点', async () => {
    const { runNode } = await mountSelection()

    expect(await runNode('far', { label: 'FAR', color: '#111' }))
      .toMatchObject({ label: 'FAR', color: '#111' })
  })

  it('有焦点时无关节点被淡出且隐藏标签', async () => {
    const { select, runNode } = await mountSelection({ dimColor: '#eee' })

    await select('a')

    expect(await runNode('b', { label: 'B' })).toMatchObject({ label: 'B' })
    expect(await runNode('far', { label: 'FAR' }))
      .toMatchObject({ color: '#eee', labelVisibility: 'hidden' })
  })

  it('dim 关闭时不淡出，只写状态', async () => {
    const { instance, select, runNode } = await mountSelection({ dim: false })

    await select('a')

    expect(await runNode('far', { label: 'FAR', color: '#111' }))
      .toMatchObject({ color: '#111', label: 'FAR' })
    expect(instance.nodeStates.get('a')).toMatchObject({ isHighlighted: true })
  })

  it('与焦点相连的边保留，其余淡出', async () => {
    const { graph, select, runEdge } = await mountSelection({ dimColor: '#eee' })

    await select('a')

    const incident = graph.edge('a', 'b')!
    const remote = graph.edge('b', 'far')!

    expect(await runEdge(incident, { label: 'e' })).toMatchObject({ label: 'e' })
    expect(await runEdge(remote, { label: 'e' }))
      .toMatchObject({ color: '#eee', labelVisibility: 'hidden' })
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

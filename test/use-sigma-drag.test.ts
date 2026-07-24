import Graph from 'graphology'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import SigmaGraph from '../src/runtime/components/Graph.vue'
import { useSigmaDrag } from '../src/runtime/composables/use-sigma-drag'
import type { UseSigmaDragOptions, UseSigmaDragReturn } from '../src/runtime/composables/use-sigma-drag'

const state = vi.hoisted(() => ({
  instances: [] as Array<{ handlers: Record<string, (payload: unknown) => void> }>
}))

vi.mock('sigma', () => {
  class MockSigma {
    handlers: Record<string, (payload: unknown) => void> = {}

    constructor() {
      state.instances.push(this)
    }

    on(event: string, handler: (payload: unknown) => void) {
      this.handlers[event] = handler
    }

    // 视口坐标到图坐标：加一个固定偏移，便于断言换算确实发生过
    viewportToGraph(point: { x: number, y: number }) {
      return { x: point.x + 1000, y: point.y + 2000 }
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
  graph.addNode('a', { x: 0, y: 0 })
  graph.addNode('b', { x: 5, y: 5 })
  return graph
}

async function mountDrag(options: UseSigmaDragOptions = {}, graph = seededGraph()) {
  let api!: UseSigmaDragReturn

  const Child = defineComponent({
    setup() {
      api = useSigmaDrag(options)
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

  const instance = state.instances[0]!
  const sigmaEvent = () => ({ preventSigmaDefault: vi.fn(), x: 0, y: 0 })

  return {
    api,
    graph,
    wrapper,
    down: (node: string) => instance.handlers.downNode?.({ node, event: sigmaEvent() }),
    move: (x: number, y: number) => instance.handlers.moveBody?.({ event: { ...sigmaEvent(), x, y } }),
    upNode: () => instance.handlers.upNode?.({ node: 'a', event: sigmaEvent() }),
    upStage: () => instance.handlers.upStage?.({ event: sigmaEvent() })
  }
}

enableAutoUnmount(afterEach)

beforeEach(() => {
  state.instances.length = 0
})

describe('useSigmaDrag', () => {
  it('按下节点进入拖拽态', async () => {
    const { api, down } = await mountDrag()

    down('a')

    expect(api.dragged.value).toBe('a')
    expect(api.isDragging.value).toBe(true)
  })

  it('按下时阻止 sigma 默认行为，否则相机会跟着平移', async () => {
    const { wrapper } = await mountDrag()
    const event = { preventSigmaDefault: vi.fn() }

    state.instances[0]!.handlers.downNode?.({ node: 'a', event })
    void wrapper

    expect(event.preventSigmaDefault).toHaveBeenCalledOnce()
  })

  it('移动时把视口坐标换算成图坐标写回节点', async () => {
    const { graph, down, move } = await mountDrag()

    down('a')
    move(3, 4)

    expect(graph.getNodeAttribute('a', 'x')).toBe(1003)
    expect(graph.getNodeAttribute('a', 'y')).toBe(2004)
  })

  it('未按下节点时移动不改坐标', async () => {
    const { graph, move } = await mountDrag()

    move(3, 4)

    expect(graph.getNodeAttribute('a', 'x')).toBe(0)
  })

  it('在节点上释放结束拖拽', async () => {
    const { api, down, upNode } = await mountDrag()

    down('a')
    upNode()

    expect(api.dragged.value).toBeNull()
    expect(api.isDragging.value).toBe(false)
  })

  it('在空白处释放结束拖拽', async () => {
    const { api, down, upStage } = await mountDrag()

    down('a')
    upStage()

    expect(api.dragged.value).toBeNull()
  })

  it('指针移出画布后在 window 上释放也能收尾', async () => {
    const { api, down } = await mountDrag()

    down('a')
    window.dispatchEvent(new MouseEvent('mouseup'))

    expect(api.dragged.value).toBeNull()
  })

  it('拖拽期间写 highlighted，结束后清除', async () => {
    const { graph, down, upStage } = await mountDrag()

    down('a')
    expect(graph.getNodeAttribute('a', 'highlighted')).toBe(true)

    upStage()
    expect(graph.getNodeAttribute('a', 'highlighted')).toBeUndefined()
  })

  it('highlight 关闭时不碰节点属性', async () => {
    const { graph, down } = await mountDrag({ highlight: false })

    down('a')

    expect(graph.getNodeAttribute('a', 'highlighted')).toBeUndefined()
  })

  it('enabled 为 false 时不响应按下', async () => {
    const { api, down } = await mountDrag({ enabled: false })

    down('a')

    expect(api.dragged.value).toBeNull()
  })

  it('拖拽中节点被移除时自动收尾，不写入已删节点', async () => {
    const { api, graph, down, move } = await mountDrag()

    down('a')
    graph.dropNode('a')
    move(3, 4)

    expect(api.dragged.value).toBeNull()
    expect(graph.hasNode('a')).toBe(false)
  })

  it('抛出开始与结束回调', async () => {
    const onStart = vi.fn()
    const onEnd = vi.fn()
    const { down, upStage } = await mountDrag({ onStart, onEnd })

    down('a')
    upStage()

    expect(onStart).toHaveBeenCalledWith('a')
    expect(onEnd).toHaveBeenCalledWith('a')
  })

  it('重复结束不会多次触发回调', async () => {
    const onEnd = vi.fn()
    const { down, upStage, api } = await mountDrag({ onEnd })

    down('a')
    upStage()
    upStage()
    api.stop()

    expect(onEnd).toHaveBeenCalledOnce()
  })
})

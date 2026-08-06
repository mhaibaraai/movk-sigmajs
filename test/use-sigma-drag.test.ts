import Graph from 'graphology'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import SigmaGraph from '../src/runtime/components/Graph.vue'
import { useSigmaDrag } from '../src/runtime/composables/use-sigma-drag'
import type { UseSigmaDragOptions, UseSigmaDragReturn } from '../src/runtime/composables/use-sigma-drag'

const state = vi.hoisted(() => ({
  instances: [] as Array<{
    handlers: Record<string, (payload: unknown) => void>
    settings: Record<string, unknown>
  }>
}))

vi.mock('sigma', () => {
  class MockSigma {
    handlers: Record<string, (payload: unknown) => void> = {}
    settings: Record<string, unknown> = {}

    constructor() {
      state.instances.push(this)
    }

    on(event: string, handler: (payload: unknown) => void) {
      this.handlers[event] = handler
    }

    setSetting(key: string, value: unknown) {
      this.settings[key] = value
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

  return {
    api,
    graph,
    wrapper,
    instance,
    dragStart: (node: string, allDraggedNodes = [node]) =>
      instance.handlers.nodeDragStart?.({ node, allDraggedNodes }),
    dragEnd: (node: string, allDraggedNodes = [node]) =>
      instance.handlers.nodeDragEnd?.({ node, allDraggedNodes })
  }
}

enableAutoUnmount(afterEach)

beforeEach(() => {
  state.instances.length = 0
})

describe('useSigmaDrag', () => {
  it('开始拖拽后进入拖拽态', async () => {
    const { api, dragStart } = await mountDrag()

    dragStart('a')

    expect(api.dragged.value).toBe('a')
    expect(api.isDragging.value).toBe(true)
  })

  it('结束拖拽后清空状态', async () => {
    const { api, dragStart, dragEnd } = await mountDrag()

    dragStart('a')
    dragEnd('a')

    expect(api.dragged.value).toBeNull()
    expect(api.isDragging.value).toBe(false)
    expect(api.draggedNodes.value).toEqual([])
  })

  it('暴露本次实际移动的全部节点', async () => {
    const { api, dragStart } = await mountDrag()

    dragStart('a', ['a', 'b'])

    expect(api.draggedNodes.value).toEqual(['a', 'b'])
  })

  it('抛出开始与结束回调，带上全部被拖拽的节点', async () => {
    const onStart = vi.fn()
    const onEnd = vi.fn()
    const { dragStart, dragEnd } = await mountDrag({ onStart, onEnd })

    dragStart('a', ['a', 'b'])
    dragEnd('a', ['a', 'b'])

    expect(onStart).toHaveBeenCalledWith('a', ['a', 'b'])
    expect(onEnd).toHaveBeenCalledWith('a', ['a', 'b'])
  })

  it('默认打开 sigma 的内置拖拽', async () => {
    const { instance } = await mountDrag()

    expect(instance.settings.enableNodeDrag).toBe(true)
  })

  it('enabled 为 false 时关闭内置拖拽', async () => {
    const { instance } = await mountDrag({ enabled: false })

    expect(instance.settings.enableNodeDrag).toBe(false)
  })

  it('enabled 支持响应式切换', async () => {
    const enabled = ref(false)
    const { instance } = await mountDrag({ enabled })

    expect(instance.settings.enableNodeDrag).toBe(false)

    enabled.value = true
    await nextTick()

    expect(instance.settings.enableNodeDrag).toBe(true)
  })
})

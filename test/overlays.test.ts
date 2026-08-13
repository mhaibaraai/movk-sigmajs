import Graph from 'graphology'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { defineComponent } from 'vue'
import { h, nextTick } from 'vue'
import SigmaGraph from '../src/runtime/components/Graph.vue'
import SigmaOverlay from '../src/runtime/components/Overlay.vue'
import SigmaTooltip from '../src/runtime/components/Tooltip.vue'
import SigmaPopover from '../src/runtime/components/Popover.vue'
import SigmaContextMenu from '../src/runtime/components/ContextMenu.vue'

const state = vi.hoisted(() => ({
  instances: [] as Array<{
    handlers: Record<string, (payload: unknown) => void>
    framedCalls: number
    graphCalls: number
    hiddenNodes: Set<string>
  }>
}))

vi.mock('sigma', () => {
  class MockSigma {
    handlers: Record<string, (payload: unknown) => void> = {}
    framedCalls = 0
    graphCalls = 0
    hiddenNodes = new Set<string>()
    graph: Graph

    constructor(graph: Graph) {
      this.graph = graph
      state.instances.push(this)
    }

    on(event: string, handler: (payload: unknown) => void) {
      this.handlers[event] = handler
    }

    getNodeDisplayData(key: string) {
      if (!this.graph.hasNode(key)) {
        return undefined
      }
      return { x: 1, y: 2, visibility: this.hiddenNodes.has(key) ? 'hidden' : 'visible' }
    }

    getGraphState() {
      return { hasHighlighted: false, hasHovered: false, isIdle: true }
    }

    // sigma 对节点用 framed 坐标，对原始图坐标用 graphToViewport，两者不能混用
    framedGraphToViewport(point: { x: number, y: number }) {
      this.framedCalls++
      return { x: point.x * 100, y: point.y * 100 }
    }

    graphToViewport(point: { x: number, y: number }) {
      this.graphCalls++
      return { x: point.x + 7, y: point.y + 7 }
    }

    viewportToGraph(point: { x: number, y: number }) {
      return { x: point.x, y: point.y }
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
  graph.addNode('a', { label: '节点 A' })
  graph.addNode('b', { label: '节点 B' })
  graph.addEdge('a', 'b', { label: '关联' })
  return graph
}

async function mountInGraph(child: ReturnType<typeof defineComponent> | (() => unknown), graph = seededGraph()) {
  const wrapper = mount(SigmaGraph, {
    props: { graph } as never,
    slots: { default: typeof child === 'function' ? child : () => h(child) }
  })

  await vi.waitFor(() => {
    if (!wrapper.vm.sigma) {
      throw new Error('sigma 尚未就绪')
    }
  })

  return { wrapper, graph, instance: state.instances[0]! }
}

enableAutoUnmount(afterEach)

beforeEach(() => {
  state.instances.length = 0
})

describe('SigmaOverlay', () => {
  it('锚定节点时走 framed 坐标换算', async () => {
    const { wrapper, instance } = await mountInGraph(() => h(SigmaOverlay, { node: 'a' }, () => '内容'))
    await nextTick()

    expect(instance.framedCalls).toBeGreaterThan(0)
    expect(instance.graphCalls).toBe(0)
    expect(wrapper.find('.sigma-overlay').attributes('style')).toContain('translate(100px, 200px)')
  })

  it('锚定图坐标时走 graphToViewport 换算', async () => {
    const { wrapper, instance } = await mountInGraph(() =>
      h(SigmaOverlay, { position: { x: 3, y: 5 } }, () => '内容')
    )
    await nextTick()

    expect(instance.graphCalls).toBeGreaterThan(0)
    expect(instance.framedCalls).toBe(0)
    expect(wrapper.find('.sigma-overlay').attributes('style')).toContain('translate(10px, 12px)')
  })

  it('offset 叠加到换算结果上', async () => {
    const { wrapper } = await mountInGraph(() =>
      h(SigmaOverlay, { node: 'a', offset: [5, -5] }, () => '内容')
    )
    await nextTick()

    expect(wrapper.find('.sigma-overlay').attributes('style')).toContain('translate(105px, 195px)')
  })

  it('节点不存在或被隐藏时不显示', async () => {
    const { wrapper } = await mountInGraph(() => h(SigmaOverlay, { node: 'missing' }, () => '内容'))
    await nextTick()

    expect(wrapper.find('.sigma-overlay').attributes('style')).toContain('display: none')
  })

  it('visible 为 false 时不显示', async () => {
    const { wrapper } = await mountInGraph(() =>
      h(SigmaOverlay, { node: 'a', visible: false }, () => '内容')
    )
    await nextTick()

    expect(wrapper.find('.sigma-overlay').attributes('style')).toContain('display: none')
  })

  it('随重绘同步位置', async () => {
    const { instance } = await mountInGraph(() => h(SigmaOverlay, { node: 'a' }, () => '内容'))
    const before = instance.framedCalls

    instance.handlers.afterRender?.(undefined)
    await nextTick()

    expect(instance.framedCalls).toBeGreaterThan(before)
  })

  it('节点转为 visibility hidden 后覆盖层跟着隐藏', async () => {
    const { wrapper, instance } = await mountInGraph(() => h(SigmaOverlay, { node: 'a' }, () => '内容'))
    await nextTick()

    expect(wrapper.find('.sigma-overlay').attributes('style')).not.toContain('display: none')

    instance.hiddenNodes.add('a')
    instance.handlers.afterRender?.(undefined)
    await nextTick()

    expect(wrapper.find('.sigma-overlay').attributes('style')).toContain('display: none')
  })
})

describe('SigmaTooltip', () => {
  it('悬浮节点后显示，离开后隐藏', async () => {
    const { wrapper, instance } = await mountInGraph(() => h(SigmaTooltip))

    instance.handlers.enterNode?.({ node: 'a' })
    await nextTick()
    expect(wrapper.text()).toContain('节点 A')

    instance.handlers.leaveNode?.({ node: 'a' })
    await nextTick()
    expect(wrapper.find('.sigma-tooltip').attributes('style')).toContain('display: none')
  })

  it('插槽以 id 暴露命中项，不用保留字 key', async () => {
    const seen: Record<string, unknown> = {}
    const { instance } = await mountInGraph(() =>
      h(SigmaTooltip, null, {
        default: (scope: Record<string, unknown>) => {
          Object.assign(seen, scope)
          return 'x'
        }
      })
    )

    instance.handlers.enterNode?.({ node: 'a' })
    await nextTick()

    expect(seen.type).toBe('node')
    expect(seen.id).toBe('a')
    expect(seen.attributes).toMatchObject({ label: '节点 A' })
  })

  it('trigger 为 click 时不响应悬浮', async () => {
    const { wrapper, instance } = await mountInGraph(() => h(SigmaTooltip, { trigger: 'click' }))

    instance.handlers.enterNode?.({ node: 'a' })
    await nextTick()
    expect(wrapper.find('.sigma-tooltip').attributes('style')).toContain('display: none')

    instance.handlers.clickNode?.({ node: 'a' })
    await nextTick()
    expect(wrapper.text()).toContain('节点 A')
  })

  it('target 为 node 时不响应边事件', async () => {
    const { wrapper, instance } = await mountInGraph(() => h(SigmaTooltip))

    instance.handlers.enterEdge?.({ edge: 'e' })
    await nextTick()

    expect(wrapper.find('.sigma-tooltip').attributes('style')).toContain('display: none')
  })

  it('响应边事件时以源节点定位', async () => {
    const seen: Record<string, unknown> = {}
    const { graph, instance } = await mountInGraph(() =>
      h(SigmaTooltip, { target: 'edge' }, {
        default: (scope: Record<string, unknown>) => {
          Object.assign(seen, scope)
          return 'x'
        }
      })
    )

    instance.handlers.enterEdge?.({ edge: graph.edge('a', 'b')! })
    await nextTick()

    expect(seen.type).toBe('edge')
    expect(seen.attributes).toMatchObject({ label: '关联' })
  })
})

describe('SigmaPopover', () => {
  it('node 为空时不显示', async () => {
    const { wrapper } = await mountInGraph(() => h(SigmaPopover, null, () => '详情'))
    await nextTick()

    expect(wrapper.find('.sigma-popover').attributes('style')).toContain('display: none')
  })

  it('锚定节点并以插槽暴露属性与关闭方法', async () => {
    const seen: Record<string, unknown> = {}
    const { wrapper } = await mountInGraph(() =>
      h(SigmaPopover, { node: 'a' }, {
        default: (scope: Record<string, unknown>) => {
          Object.assign(seen, scope)
          return '详情'
        }
      })
    )
    await nextTick()

    expect(wrapper.text()).toContain('详情')
    expect(seen.node).toBe('a')
    expect(seen.attributes).toMatchObject({ label: '节点 A' })
    expect(typeof seen.close).toBe('function')
  })

  it('close 关闭后隐藏', async () => {
    let close: (() => void) | undefined
    const { wrapper } = await mountInGraph(() =>
      h(SigmaPopover, { node: 'a' }, {
        default: (scope: Record<string, unknown>) => {
          close = scope.close as () => void
          return '详情'
        }
      })
    )
    await nextTick()

    close!()
    await nextTick()

    expect(wrapper.find('.sigma-popover').attributes('style')).toContain('display: none')
  })
})

describe('SigmaContextMenu', () => {
  it('右键节点后显示，并同时拦住 sigma 与浏览器的默认行为', async () => {
    const preventSigmaDefault = vi.fn()
    const preventDefault = vi.fn()
    const { wrapper, instance } = await mountInGraph(() =>
      h(SigmaContextMenu, null, { default: () => '菜单' })
    )

    instance.handlers.rightClickNode?.({
      node: 'a',
      event: { preventSigmaDefault, original: { preventDefault } }
    })
    await nextTick()

    expect(preventSigmaDefault).toHaveBeenCalledOnce()
    // 不拦原生事件的话浏览器菜单会和自定义菜单一起弹出来
    expect(preventDefault).toHaveBeenCalledOnce()
    expect(wrapper.text()).toContain('菜单')
  })

  it('未声明的目标类型不响应，也不拦浏览器菜单', async () => {
    const preventDefault = vi.fn()
    const { wrapper, instance } = await mountInGraph(() =>
      h(SigmaContextMenu, null, { default: () => '菜单' })
    )

    instance.handlers.rightClickEdge?.({
      edge: 'e',
      event: { preventSigmaDefault: vi.fn(), original: { preventDefault } }
    })
    await nextTick()

    expect(preventDefault).not.toHaveBeenCalled()
    expect(wrapper.find('.sigma-context-menu').attributes('style')).toContain('display: none')
  })

  it('空白处右键时按图坐标定位', async () => {
    const { instance } = await mountInGraph(() =>
      h(SigmaContextMenu, { target: ['stage'] }, { default: () => '菜单' })
    )

    instance.handlers.rightClickStage?.({
      event: { x: 10, y: 20, preventSigmaDefault: vi.fn(), original: { preventDefault: vi.fn() } }
    })
    await nextTick()

    expect(instance.graphCalls).toBeGreaterThan(0)
  })

  it('左键点击后关闭', async () => {
    const { wrapper, instance } = await mountInGraph(() =>
      h(SigmaContextMenu, null, { default: () => '菜单' })
    )

    instance.handlers.rightClickNode?.({
      node: 'a',
      event: { preventSigmaDefault: vi.fn(), original: { preventDefault: vi.fn() } }
    })
    await nextTick()
    instance.handlers.clickStage?.({})
    await nextTick()

    expect(wrapper.find('.sigma-context-menu').attributes('style')).toContain('display: none')
  })
})

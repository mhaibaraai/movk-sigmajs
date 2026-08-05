import Graph from 'graphology'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SerializedGraph } from 'graphology-types'
import SigmaGraph from '../src/runtime/components/Graph.vue'
import { useSigmaById } from '../src/runtime/composables/use-sigma'

/** 捕获 Sigma 构造参数。happy-dom 无 WebGL 上下文，必须 mock 掉构造本身 */
type SigmaOptions = {
  settings: Record<string, unknown>
  styles?: unknown
  primitives?: unknown
  nodeReducer?: (...args: unknown[]) => Record<string, unknown>
  edgeReducer?: (...args: unknown[]) => Record<string, unknown>
}

const state = vi.hoisted(() => ({
  calls: [] as Array<{ graph: unknown, container: unknown, options: SigmaOptions }>,
  events: [] as string[],
  killed: 0
}))

vi.mock('sigma', () => {
  class MockSigma {
    settings: Record<string, unknown>
    constructor(graph: unknown, container: unknown, options: SigmaOptions) {
      this.settings = options.settings
      state.calls.push({ graph, container, options })
    }

    on(event: string) {
      state.events.push(event)
    }

    off() {}
    resize() {}
    refresh() {}
    setGraph() {}
    kill() {
      state.killed++
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

function serialized(partial: Partial<SerializedGraph>): SerializedGraph {
  return {
    attributes: {},
    options: { type: 'mixed', multi: false, allowSelfLoops: true },
    nodes: [],
    edges: [],
    ...partial
  } as SerializedGraph
}

/**
 * 组件在 onMounted 里动态导入 sigma，flushPromises 不足以等真实模块加载完成，
 * 必须轮询到实例真正创建为止，否则断言会读到别的用例迟到解析出的调用
 */
async function mountGraph(props: Record<string, unknown> = {}, options: Record<string, unknown> = {}) {
  // 部分用例刻意传入 sigma 类型里不存在的键，用来验证透传不做过滤
  const wrapper = mount(SigmaGraph, { props: props as never, ...options })
  await vi.waitFor(() => {
    if (!wrapper.vm.sigma) {
      throw new Error('sigma 尚未就绪')
    }
  })
  return wrapper
}

enableAutoUnmount(afterEach)

beforeEach(() => {
  state.calls.length = 0
  state.events.length = 0
  state.killed = 0
})

describe('SigmaGraph 出口兼容', () => {
  it('settings 整体透传，库未知的键原样到达 sigma', async () => {
    await mountGraph({
      settings: { someFutureSigmaOption: 'kept', renderLabels: false }
    })

    const settings = state.calls[0]!.options.settings
    expect(settings.someFutureSigmaOption).toBe('kept')
    expect(settings.renderLabels).toBe(false)
  })

  it('用户自带的 nodeReducer 位于链首被调用，返回的补丁合并进显示数据', async () => {
    const nodeReducer = vi.fn(() => ({ size: 20 }))

    await mountGraph({ nodeReducer })

    // 传给 sigma 的是稳定的 dispatcher，不是原函数：链要替只返回补丁的归约补全 x / y，
    // 否则 sigma 拿不到完整显示数据会直接抛错
    const dispatch = state.calls[0]!.options.nodeReducer!
    const result = dispatch('n1', { x: 1, y: 2, label: 'N1' }, {}, {}, {}, {})

    expect(nodeReducer).toHaveBeenCalledWith('n1', expect.objectContaining({ label: 'N1' }), {}, {}, {}, {})
    expect(result).toMatchObject({ x: 1, y: 2, label: 'N1', size: 20 })
  })

  it('内置默认 allowInvalidContainer 可被用户覆盖', async () => {
    await mountGraph()
    expect(state.calls[0]!.options.settings.allowInvalidContainer).toBe(true)

    state.calls.length = 0
    await mountGraph({ settings: { allowInvalidContainer: false } })
    expect(state.calls[0]!.options.settings.allowInvalidContainer).toBe(false)
  })

  it('styles 整体透传，不做键白名单', async () => {
    const styles = {
      nodes: { color: '#f43f5e', someFutureStyleKey: 1 },
      edges: { parallelPath: 'curved' }
    }

    await mountGraph({ styles })

    expect(state.calls[0]!.options.styles).toMatchObject(styles)
  })

  it('primitives 整体透传', async () => {
    const primitives = {
      nodes: { shapes: [{ name: 'hex', glsl: 'float d = 0.0;' }] },
      depthLayers: ['edges', 'nodes']
    }

    await mountGraph({ primitives })

    expect(state.calls[0]!.options.primitives).toMatchObject(primitives)
  })

  it('未传 styles 与 primitives 时不干预 sigma 自己的默认值', async () => {
    await mountGraph()

    expect(state.calls[0]!.options.styles).toBeUndefined()
    expect(state.calls[0]!.options.primitives).toBeUndefined()
  })

  it('styles 是构造时读取的，变更后重建实例', async () => {
    const wrapper = await mountGraph({ styles: { nodes: { color: '#111' } } })
    expect(state.calls).toHaveLength(1)

    await wrapper.setProps({ styles: { nodes: { color: '#222' } } } as never)
    await vi.waitFor(() => {
      if (state.calls.length < 2) {
        throw new Error('尚未重建')
      }
    })

    expect(state.killed).toBe(1)
    expect(state.calls[1]!.options.styles).toMatchObject({ nodes: { color: '#222' } })
  })

  it('绑定 sigma 的全部 52 个事件', async () => {
    await mountGraph()

    expect(state.events).toContain('clickNode')
    expect(state.events).toContain('enterEdge')
    expect(state.events).toContain('afterRender')
    expect(state.events).toContain('clickNodeLabel')
    expect(state.events).toContain('nodeDragStart')
    expect(state.events).toHaveLength(52)
  })

  it('settings 变化后经 setSettings 同步，仍不做键过滤', async () => {
    const wrapper = await mountGraph({ settings: { renderLabels: true } })

    await wrapper.setProps({ settings: { renderLabels: false, anotherUnknownKey: 1 } as never })

    const instance = wrapper.vm.sigma as unknown as { getSettings: () => Record<string, unknown> }
    expect(instance.getSettings().anotherUnknownKey).toBe(1)
    expect(instance.getSettings().renderLabels).toBe(false)
  })
})

describe('SigmaGraph 数据通道', () => {
  it('传 data 时内部建图并增量同步', async () => {
    const wrapper = await mountGraph({
      data: serialized({ nodes: [{ key: 'a', attributes: { label: 'A' } }] })
    })

    const graph = wrapper.vm.graph as Graph
    expect(graph.order).toBe(1)
    expect(graph.getNodeAttribute('a', 'label')).toBe('A')
  })

  it('传外部 graph 时组件完全不碰数据', async () => {
    const external = new Graph()
    external.addNode('kept')

    await mountGraph({
      graph: external,
      data: serialized({ nodes: [{ key: 'ignored', attributes: {} }] })
    })

    expect(external.nodes()).toEqual(['kept'])
    expect(state.calls[0]!.graph).toBe(external)
  })

  it('data 变化时增量同步且保留坐标', async () => {
    const wrapper = await mountGraph({
      data: serialized({ nodes: [{ key: 'a', attributes: { x: 7, y: 8 } }] })
    })

    await wrapper.setProps({
      data: serialized({ nodes: [{ key: 'a', attributes: { label: 'A' } }] })
    })

    const graph = wrapper.vm.graph as Graph
    expect(graph.getNodeAttribute('a', 'x')).toBe(7)
    expect(graph.getNodeAttribute('a', 'label')).toBe('A')
  })
})

describe('SigmaGraph 生命周期与实例访问', () => {
  it('挂载完成前不实例化，sigma 推迟到客户端动态导入后才创建', async () => {
    const wrapper = mount(SigmaGraph)
    // 动态导入尚未兑现，此刻不应有任何实例
    expect(state.calls).toHaveLength(0)
    expect(wrapper.vm.sigma).toBeNull()

    await vi.waitFor(() => {
      if (!wrapper.vm.sigma) {
        throw new Error('sigma 尚未就绪')
      }
    })
    expect(state.calls).toHaveLength(1)
  })

  it('挂载后经 id 可在组件树之外取到上下文', async () => {
    await mountGraph({ id: 'main' })

    const context = useSigmaById('main')
    expect(context.value).toBeDefined()
    expect(context.value!.isReady.value).toBe(true)
    expect(context.value!.sigma.value).not.toBeNull()
  })

  it('卸载后从注册表移除并销毁实例', async () => {
    const wrapper = await mountGraph({ id: 'disposable' })
    expect(useSigmaById('disposable').value).toBeDefined()

    wrapper.unmount()

    expect(useSigmaById('disposable').value).toBeUndefined()
    expect(state.killed).toBe(1)
  })

  it('挂载完成前卸载不会残留实例', async () => {
    const wrapper = mount(SigmaGraph)
    wrapper.unmount()
    await flushPromises()
    await flushPromises()

    expect(state.calls).toHaveLength(0)
  })

  it('默认插槽以作用域暴露原生实例', async () => {
    const seen: Record<string, unknown> = {}

    await mountGraph({}, {
      slots: {
        default: (params: { sigma: unknown, graph: unknown }) => {
          seen.sigma = params.sigma
          seen.graph = params.graph
          return 'ok'
        }
      }
    })

    expect(seen.sigma).toBeTruthy()
    expect(seen.graph).toBeInstanceOf(Graph)
  })
})

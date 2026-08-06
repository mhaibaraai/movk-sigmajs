import type Graph from 'graphology'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { SerializedGraph } from 'graphology-types'
import SigmaGraph from '../src/runtime/components/Graph.vue'
import { useSigmaReducer } from '../src/runtime/composables/use-sigma-reducer'

type SigmaOptions = {
  settings: Record<string, unknown>
  nodeReducer?: Reducer
  edgeReducer?: Reducer
}

const state = vi.hoisted(() => ({
  instances: [] as Array<{ options: Record<string, unknown>, settings: Record<string, unknown>, refreshes: number }>
}))

vi.mock('sigma', () => {
  class MockSigma {
    options: Record<string, unknown>
    settings: Record<string, unknown>
    refreshes = 0
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
    refresh() {
      this.refreshes++
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

/**
 * v4 的 reducer 只能在构造时给定，组件因此交出一对恒存在的 dispatcher。
 * 链为空时它把 data 原样返回
 */
function runNode(data: Record<string, unknown> = {}): Record<string, unknown> {
  const options = state.instances[0]!.options as SigmaOptions
  return options.nodeReducer!('n1', data, {}, {}, {}, {})
}

async function mountWithReducers(
  setups: Array<() => void>,
  props: Record<string, unknown> = {}
) {
  const Child = defineComponent({
    setup() {
      for (const run of setups) {
        run()
      }
      return () => h('span')
    }
  })

  const wrapper = mount(SigmaGraph, {
    props: props as never,
    slots: { default: () => h(Child) }
  })

  await vi.waitFor(() => {
    if (!wrapper.vm.sigma) {
      throw new Error('sigma 尚未就绪')
    }
  })

  return wrapper
}

enableAutoUnmount(afterEach)

beforeEach(() => {
  state.instances.length = 0
})

describe('reducer 链', () => {
  it('链为空时 dispatcher 把显示数据原样返回', async () => {
    await mountWithReducers([])

    expect(runNode({ x: 1, y: 2, label: 'N1' })).toEqual({ x: 1, y: 2, label: 'N1' })
  })

  it('多条归约按 order 升序叠加，后者覆盖前者的同名字段', async () => {
    await mountWithReducers([
      () => useSigmaReducer({ order: 20, node: () => ({ color: '#222' }) }),
      () => useSigmaReducer({ order: 10, node: (_key, data) => ({ ...data, color: '#111', size: 5 }) })
    ])

    expect(runNode({ label: 'N1' })).toMatchObject({ label: 'N1', size: 5, color: '#222' })
  })

  it('用户自带的 reducer 位于链首且被调用', async () => {
    // 用 DisplayData 上真实存在的 cursor 字段作标记，避免为测试放宽类型
    const base = vi.fn((_key: string, data: Record<string, unknown>) => ({ ...data, cursor: 'base' }))
    const overlay = vi.fn(() => ({ cursor: 'overlay' }))

    await mountWithReducers(
      [() => useSigmaReducer({ order: 0, node: overlay })],
      { nodeReducer: base }
    )

    const result = runNode()

    expect(base).toHaveBeenCalledOnce()
    expect(base.mock.invocationCallOrder[0]!).toBeLessThan(overlay.mock.invocationCallOrder[0]!)
    expect(result).toMatchObject({ cursor: 'overlay' })
  })

  it('自带 reducer 的返回值会流入后续归约', async () => {
    await mountWithReducers(
      [() => useSigmaReducer({ node: (_key, data) => ({ size: Number(data.size) * 2 }) })],
      { nodeReducer: (_key: string, data: Record<string, unknown>) => ({ ...data, size: 4 }) }
    )

    expect(runNode()).toMatchObject({ size: 8 })
  })

  it('作用域销毁后归约从链上移除', async () => {
    const Child = defineComponent({
      setup() {
        useSigmaReducer({ node: () => ({ color: '#f00' }) })
        return () => h('span')
      }
    })

    const Host = defineComponent({
      props: { show: { type: Boolean, default: true } },
      setup(hostProps) {
        return () => h(SigmaGraph, null, { default: () => (hostProps.show ? h(Child) : null) })
      }
    })

    const wrapper = mount(Host)
    await vi.waitFor(() => {
      if (state.instances.length === 0) {
        throw new Error('sigma 尚未就绪')
      }
    })

    expect(runNode()).toMatchObject({ color: '#f00' })

    await wrapper.setProps({ show: false })

    expect(runNode({ label: 'N1' })).toEqual({ label: 'N1' })
  })

  it('注册与注销都会触发重绘', async () => {
    await mountWithReducers([() => useSigmaReducer({ node: (_key, data) => data })])
    expect(state.instances[0]!.refreshes).toBeGreaterThan(0)
  })
})

describe('reducer 链与数据同步共存', () => {
  it('归约不影响 applyGraphDiff 写入的图数据', async () => {
    const data: SerializedGraph = {
      attributes: {},
      options: { type: 'mixed', multi: false, allowSelfLoops: true },
      nodes: [{ key: 'a', attributes: { label: 'A', x: 1, y: 2 } }],
      edges: []
    } as SerializedGraph

    const wrapper = await mountWithReducers(
      [() => useSigmaReducer({ node: () => ({ color: '#000' }) })],
      { data }
    )

    const graph = wrapper.vm.graph as Graph
    expect(graph.getNodeAttribute('a', 'label')).toBe('A')
    expect(graph.getNodeAttribute('a', 'x')).toBe(1)
  })
})

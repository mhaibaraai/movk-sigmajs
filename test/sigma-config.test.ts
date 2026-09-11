import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SigmaGraph from '../src/runtime/components/Graph.vue'
import { getSigmaConfig, setSigmaConfig } from '../src/runtime/config'

type SigmaOptions = { settings: Record<string, unknown> }

const state = vi.hoisted(() => ({
  calls: [] as SigmaOptions[]
}))

vi.mock('sigma', () => {
  class MockSigma {
    settings: Record<string, unknown>
    constructor(_graph: unknown, _container: unknown, options: SigmaOptions) {
      this.settings = options.settings
      state.calls.push(options)
    }

    on() {}
    off() {}
    resize() {}
    refresh() {}
    setGraph() {}
    kill() {}
    setSettings(next: Record<string, unknown>) {
      this.settings = next
    }

    getSettings() {
      return this.settings
    }
  }

  return { default: MockSigma }
})

async function mountGraph(props: Record<string, unknown> = {}) {
  const wrapper = mount(SigmaGraph, { props: props as never })
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
  setSigmaConfig({ settings: {} })
})

describe('运行时配置单例', () => {
  it('写入与已有值浅合并，读回同一份引用', () => {
    setSigmaConfig({ settings: { renderLabels: false } })

    expect(getSigmaConfig().settings).toEqual({ renderLabels: false })
    expect(getSigmaConfig()).toBe(getSigmaConfig())
  })

  it('挂在 globalThis 上，双份构建共享同一份状态', () => {
    const store = (globalThis as Record<symbol, unknown>)[Symbol.for('movk-sigma:config')]

    expect(store).toBeDefined()
    expect((store as { config: unknown }).config).toBe(getSigmaConfig())
  })
})

describe('全局默认 settings 参与合并', () => {
  it('未传组件级 settings 时直接采用全局默认', async () => {
    setSigmaConfig({ settings: { renderEdgeLabels: true, someFutureSigmaOption: 'global' } as never })

    await mountGraph()

    const settings = state.calls[0]!.settings
    expect(settings.renderEdgeLabels).toBe(true)
    expect(settings.someFutureSigmaOption).toBe('global')
  })

  it('组件级 settings 优先于全局默认，未覆盖的键仍从全局兜底', async () => {
    setSigmaConfig({ settings: { renderLabels: false, renderEdgeLabels: true } })

    await mountGraph({ settings: { renderLabels: true } })

    const settings = state.calls[0]!.settings
    expect(settings.renderLabels).toBe(true)
    expect(settings.renderEdgeLabels).toBe(true)
  })

  it('组件挂载后写入的全局默认不影响已建实例，避免隐式重建', async () => {
    await mountGraph({ settings: { renderLabels: true } })
    setSigmaConfig({ settings: { renderLabels: false } })

    expect(state.calls[0]!.settings.renderLabels).toBe(true)
  })
})

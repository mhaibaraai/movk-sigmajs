import Graph from 'graphology'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SigmaGraph from '../src/runtime/components/Graph.vue'
import { defineSigmaProgram, isLazySigmaProgram } from '../src/runtime/utils/define-sigma-program'

const state = vi.hoisted(() => ({
  instances: [] as Array<{ settings: Record<string, unknown> }>
}))

vi.mock('sigma', () => {
  class MockSigma {
    settings: Record<string, unknown>
    constructor(_graph: unknown, _container: unknown, settings: Record<string, unknown>) {
      this.settings = settings
      state.instances.push(this)
    }

    on() {}
    off() {}
    resize() {}
    kill() {}
    setGraph() {}
    refresh() {}
    setSettings(next: Record<string, unknown>) {
      this.settings = { ...this.settings, ...next }
    }

    getSettings() {
      return this.settings
    }
  }

  return { default: MockSigma }
})

async function mountWithPrograms(programs: unknown) {
  const wrapper = mount(SigmaGraph, {
    props: { graph: new Graph(), programs } as never
  })

  await vi.waitFor(() => {
    if (!wrapper.vm.sigma) {
      throw new Error('sigma 尚未就绪')
    }
  })

  return wrapper
}

function nodeClasses() {
  return state.instances[0]!.settings.nodeProgramClasses as Record<string, unknown>
}

enableAutoUnmount(afterEach)

beforeEach(() => {
  state.instances.length = 0
})

describe('defineSigmaProgram', () => {
  it('产物可被识别，程序类本身不会被误判', () => {
    class FakeProgram {
      readonly kind = 'fakeprogram'
    }

    expect(isLazySigmaProgram(defineSigmaProgram(() => FakeProgram))).toBe(true)
    // 程序类也是 function，靠 typeof 无法区分，因此才需要显式标记
    expect(isLazySigmaProgram(FakeProgram)).toBe(false)
    expect(isLazySigmaProgram(() => FakeProgram)).toBe(false)
  })
})

describe('SigmaGraph programs', () => {
  it('直接传入的程序类与内置程序合并', async () => {
    class Custom {
      readonly kind = 'custom'
    }

    await mountWithPrograms({ node: { custom: Custom } })

    expect(nodeClasses().custom).toBe(Custom)
    expect(nodeClasses().circle).toBeDefined()
  })

  it('延迟加载的程序在建实例前就已解析完', async () => {
    class Lazy {
      readonly kind = 'lazy'
    }
    const loader = vi.fn(async () => Lazy)

    await mountWithPrograms({ node: { lazy: defineSigmaProgram(loader) } })

    expect(loader).toHaveBeenCalledOnce()
    // 建实例时就已是解析好的类，不存在节点带未注册 type 先渲染的时间窗
    expect(nodeClasses().lazy).toBe(Lazy)
  })

  it('同步返回的延迟声明同样支持', async () => {
    class Sync {
      readonly kind = 'sync'
    }

    await mountWithPrograms({ node: { sync: defineSigmaProgram(() => Sync) } })

    expect(nodeClasses().sync).toBe(Sync)
  })

  it('边程序走同一条解析路径', async () => {
    class LazyEdge {
      readonly kind = 'lazyedge'
    }

    await mountWithPrograms({ edge: { curve: defineSigmaProgram(async () => LazyEdge) } })

    const classes = state.instances[0]!.settings.edgeProgramClasses as Record<string, unknown>
    expect(classes.curve).toBe(LazyEdge)
    expect(classes.line).toBeDefined()
  })

  it('未传 programs 时不干预 sigma 自己的默认值', async () => {
    await mountWithPrograms(undefined)
    expect(state.instances[0]!.settings.nodeProgramClasses).toBeUndefined()
  })
})

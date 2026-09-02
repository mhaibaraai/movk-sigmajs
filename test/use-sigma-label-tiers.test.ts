import Graph from 'graphology'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import SigmaGraph from '../src/runtime/components/Graph.vue'
import { useSigmaLabelTiers } from '../src/runtime/composables/use-sigma-label-tiers'
import type { UseSigmaLabelTiersOptions, UseSigmaLabelTiersReturn } from '../src/runtime/composables/use-sigma-label-tiers'

const state = vi.hoisted(() => ({
  instances: [] as Array<{
    options: Record<string, unknown>
    settings: Record<string, unknown>
    camera: { ratio: number, handlers: Record<string, (() => void) | undefined> }
  }>
}))

vi.mock('sigma', () => {
  class MockCamera {
    ratio = 1
    handlers: Record<string, (() => void) | undefined> = {}
    on(event: string, handler: () => void) {
      this.handlers[event] = handler
    }

    off(event: string) {
      this.handlers[event] = undefined
    }
  }

  class MockSigma {
    options: Record<string, unknown> = {}
    settings: Record<string, unknown>
    camera = new MockCamera()
    constructor(_graph: unknown, _container: unknown, options: { settings: Record<string, unknown> }) {
      this.options = options
      this.settings = options.settings
      state.instances.push(this)
    }

    getCamera() {
      return this.camera
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

async function mountTiers(options: UseSigmaLabelTiersOptions = {}) {
  let api!: UseSigmaLabelTiersReturn

  const Child = defineComponent({
    setup() {
      api = useSigmaLabelTiers(options)
      return () => h('span')
    }
  })

  const graph = new Graph()
  graph.addNode('a', { label: 'A', labelTier: 0 })
  graph.addNode('b', { label: 'B', labelTier: 2 })

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
    async moveCamera(ratio: number) {
      instance.camera.ratio = ratio
      instance.camera.handlers.updated?.()
      await nextTick()
    },
    // 走真实的 evaluateNodeStyle，顺带验证库内规则确实合成进了声明里
    async evaluate(attributes: Record<string, unknown>) {
      const { evaluateNodeStyle } = await import('sigma/types')
      const styles = instance.options.styles as { nodes: Record<string, unknown>[] }
      return evaluateNodeStyle(styles.nodes, { x: 0, y: 0, ...attributes }, NODE_STATE, GRAPH_STATE, graph)
    }
  }
}

const NODE_STATE = {
  isHovered: false,
  isLabelHovered: false,
  isHidden: false,
  isHighlighted: false,
  isDragged: false
}

const GRAPH_STATE = {
  isIdle: true,
  isPanning: false,
  isZooming: false,
  isDragging: false,
  hasHovered: false,
  hasHighlighted: false
}

enableAutoUnmount(afterEach)

beforeEach(() => {
  state.instances.length = 0
})

describe('useSigmaLabelTiers', () => {
  it('相机比例小于所有断点时不限制档位', async () => {
    const { api } = await mountTiers()

    expect(api.tier.value).toBe(Number.POSITIVE_INFINITY)
  })

  it('比例越过断点后收窄到对应档位', async () => {
    const { api, moveCamera } = await mountTiers()

    await moveCamera(1.5)
    expect(api.tier.value).toBe(1)

    await moveCamera(3)
    expect(api.tier.value).toBe(0)

    await moveCamera(1)
    expect(api.tier.value).toBe(Number.POSITIVE_INFINITY)
  })

  it('自定义断点生效', async () => {
    const { api, moveCamera } = await mountTiers({ breakpoints: [[10, 0]] })

    await moveCamera(5)
    expect(api.tier.value).toBe(Number.POSITIVE_INFINITY)

    await moveCamera(20)
    expect(api.tier.value).toBe(0)
  })

  it('超出当前档位的节点标签被隐藏', async () => {
    const { moveCamera, evaluate } = await mountTiers()

    await moveCamera(1.5)

    // 隐藏而非置空：sigma 用 auto 的标签参与网格竞争，hidden 的直接让出名额
    expect((await evaluate({ labelTier: 2 })).labelVisibility).toBe('hidden')
    expect((await evaluate({ labelTier: 0 })).labelVisibility).not.toBe('hidden')
  })

  it('没有档位属性的节点不受影响', async () => {
    const { moveCamera, evaluate } = await mountTiers()

    await moveCamera(3)

    expect((await evaluate({})).labelVisibility).not.toBe('hidden')
  })

  it('读取的属性名可配置', async () => {
    const { moveCamera, evaluate } = await mountTiers({ attribute: 'rankTier' })

    await moveCamera(3)

    expect((await evaluate({ rankTier: 2 })).labelVisibility).toBe('hidden')
    expect((await evaluate({ labelTier: 2 })).labelVisibility).not.toBe('hidden')
  })
})

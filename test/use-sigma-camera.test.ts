import Graph from 'graphology'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import SigmaGraph from '../src/runtime/components/Graph.vue'
import { useSigmaCamera } from '../src/runtime/composables/use-sigma-camera'
import type { CameraState } from 'sigma/types'
import type { UseSigmaCameraReturn } from '../src/runtime/composables/use-sigma-camera'

const STAGE_WIDTH = 1000

const STAGE_HEIGHT = 800

const state = vi.hoisted(() => ({
  base: { x: 0.5, y: 0.5, ratio: 0.3, angle: 0 } as CameraState,
  animated: [] as CameraState[],
  applied: [] as CameraState[],
  fitCalls: [] as Array<{ nodes: string[], options: unknown }>
}))

vi.mock('sigma', () => {
  class MockSigma {
    graph: Graph

    constructor(graph: Graph) {
      this.graph = graph
    }

    on() {}
    off() {}
    resize() {}
    kill() {}
    setGraph() {}
    refresh() {}
    setSettings() {}
    getSettings() {
      return {}
    }

    getGraph() {
      return this.graph
    }

    getDimensions() {
      return { width: STAGE_WIDTH, height: STAGE_HEIGHT }
    }

    /**
     * 线性简化：以舞台中心为原点，按相机比例把像素折算成 framed 坐标。
     * 真实矩阵还带角度与图尺寸归一化，此处只需保证「两点之差即偏移量」这条性质成立
     */
    viewportToFramedGraph(
      coordinates: { x: number, y: number },
      override?: { cameraState?: CameraState }
    ) {
      const ratio = override?.cameraState?.ratio ?? 1
      return {
        x: (coordinates.x - STAGE_WIDTH / 2) * ratio / STAGE_WIDTH,
        y: (coordinates.y - STAGE_HEIGHT / 2) * ratio / STAGE_HEIGHT
      }
    }

    getCamera() {
      return {
        async animate(next: CameraState) {
          state.animated.push(next)
        },
        setState(next: CameraState) {
          state.applied.push(next)
        }
      }
    }
  }

  return { default: MockSigma }
})

vi.mock('@sigma/utils', () => ({
  fitViewportToNodes: async (_instance: unknown, nodes: string[], options: unknown) => {
    state.fitCalls.push({ nodes, options })
  },
  getCameraStateToFitViewportToNodes: () => ({ ...state.base })
}))

async function mountCamera() {
  let api!: UseSigmaCameraReturn

  const Child = defineComponent({
    setup() {
      api = useSigmaCamera()
      return () => h('span')
    }
  })

  const graph = new Graph()
  graph.addNode('n0', { x: 0, y: 0 })
  graph.addNode('n1', { x: 1, y: 1 })

  const wrapper = mount(SigmaGraph, {
    props: { graph } as never,
    slots: { default: () => h(Child) }
  })

  await vi.waitFor(() => {
    if (!wrapper.vm.sigma) {
      throw new Error('sigma 尚未就绪')
    }
  })

  return { api, graph, wrapper }
}

enableAutoUnmount(afterEach)

beforeEach(() => {
  state.base = { x: 0.5, y: 0.5, ratio: 0.3, angle: 0 }
  state.animated.length = 0
  state.applied.length = 0
  state.fitCalls.length = 0
})

describe('useSigmaCamera fitTo', () => {
  it('无遮挡也无下限时走上游实现，参数原样透传', async () => {
    const { api } = await mountCamera()

    await api.fitTo(['n0'], { animate: false })

    expect(state.fitCalls).toEqual([{ nodes: ['n0'], options: { animate: false } }])
    expect(state.animated).toHaveLength(0)
    expect(state.applied).toHaveLength(0)
  })

  it('省略节点时容纳全图', async () => {
    const { api } = await mountCamera()

    await api.fitTo()

    expect(state.fitCalls[0]!.nodes).toEqual(['n0', 'n1'])
  })

  it('空节点集合不动相机', async () => {
    const { api } = await mountCamera()

    await api.fitTo([], { insets: { left: 400 } })

    expect(state.fitCalls).toHaveLength(0)
    expect(state.animated).toHaveLength(0)
  })

  it('遮挡按可用区收缩比退远，并把内容挪出遮挡侧', async () => {
    const { api } = await mountCamera()

    await api.fitTo(['n0'], { animate: false, insets: { left: 400 } })

    // 可用区 600x800，退远倍数取 max(1000/600, 800/800)
    const target = state.applied[0]!
    expect(target.ratio).toBeCloseTo(state.base.ratio * (STAGE_WIDTH / 600))
    // 可用区中心在舞台中心右侧，相机因此左移，内容才落进可用区
    expect(target.x).toBeLessThan(state.base.x)
    expect(target.y).toBeCloseTo(state.base.y)
  })

  it('animate 为真时走动画而非 setState', async () => {
    const { api } = await mountCamera()

    await api.fitTo(['n0'], { insets: { top: 96 } })

    expect(state.applied).toHaveLength(0)
    expect(state.animated).toHaveLength(1)
    expect(state.animated[0]!.y).not.toBe(state.base.y)
  })

  it('minRatio 钳住比例下限', async () => {
    const { api } = await mountCamera()
    state.base = { x: 0, y: 0, ratio: 0.001, angle: 0 }

    await api.fitTo(['n0'], { animate: false, minRatio: 0.12 })

    expect(state.applied[0]!.ratio).toBe(0.12)
  })

  it('遮挡之和超过画布时保底可用区，不产生 NaN', async () => {
    const { api } = await mountCamera()

    await api.fitTo(['n0'], { animate: false, insets: { left: 700, right: 700 } })

    const target = state.applied[0]!
    expect(Number.isFinite(target.ratio)).toBe(true)
    expect(Number.isFinite(target.x)).toBe(true)
    expect(Number.isFinite(target.y)).toBe(true)
  })
})

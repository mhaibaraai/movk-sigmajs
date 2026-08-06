import Graph from 'graphology'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import SigmaGraph from '../src/runtime/components/Graph.vue'
import { useSigmaLayout } from '../src/runtime/composables/use-sigma-layout'
import type { SigmaLayoutName } from '../src/runtime/types'
import type { UseSigmaLayoutOptions, UseSigmaLayoutReturn } from '../src/runtime/composables/use-sigma-layout'

const state = vi.hoisted(() => ({
  refreshes: 0,
  supervisors: [] as Array<{ started: number, stopped: number, killed: number, running: boolean }>,
  workerSettings: [] as unknown[]
}))

vi.mock('sigma', () => {
  class MockSigma {
    on() {}
    off() {}
    resize() {}
    kill() {}
    setGraph() {}
    setSettings() {}
    getSettings() {
      return {}
    }

    refresh() {
      state.refreshes++
    }
  }

  return { default: MockSigma }
})

/** worker 版 supervisor 的形状：start / stop / kill / isRunning */
function makeSupervisorMock() {
  return class Supervisor {
    record: { started: number, stopped: number, killed: number, running: boolean }
    constructor(_graph: Graph, options: unknown) {
      state.workerSettings.push(options)
      this.record = { started: 0, stopped: 0, killed: 0, running: false }
      state.supervisors.push(this.record)
    }

    start() {
      this.record.started++
      this.record.running = true
    }

    stop() {
      this.record.stopped++
      this.record.running = false
    }

    kill() {
      this.record.killed++
      this.record.running = false
    }

    isRunning() {
      return this.record.running
    }
  }
}

vi.mock('graphology-layout-forceatlas2/worker', () => ({ default: makeSupervisorMock() }))
vi.mock('graphology-layout-noverlap/worker', () => ({ default: makeSupervisorMock() }))

/** 默认图：一个三点分量加三个孤立点 */
function makeGraph(): Graph {
  const graph = new Graph()
  for (let i = 0; i < 6; i++) {
    graph.addNode(`n${i}`, { x: 0, y: 0 })
  }
  graph.addEdge('n0', 'n1')
  graph.addEdge('n1', 'n2')

  return graph
}

/** 三个互不相连的三角形，用来验证分量打包 */
function makeComponentGraph(): Graph {
  const graph = new Graph()

  for (let group = 0; group < 3; group++) {
    for (let i = 0; i < 3; i++) {
      graph.addNode(`c${group}-${i}`, { x: Math.cos(i) * 10, y: Math.sin(i) * 10, size: 5 })
    }
    graph.addEdge(`c${group}-0`, `c${group}-1`)
    graph.addEdge(`c${group}-1`, `c${group}-2`)
    graph.addEdge(`c${group}-2`, `c${group}-0`)
  }

  return graph
}

async function mountLayout(
  name: SigmaLayoutName,
  options: UseSigmaLayoutOptions = {},
  graph: Graph = makeGraph()
) {
  let api!: UseSigmaLayoutReturn

  const Child = defineComponent({
    setup() {
      api = useSigmaLayout(name, options)
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

  return { api, graph, wrapper }
}

enableAutoUnmount(afterEach)

beforeEach(() => {
  state.refreshes = 0
  state.supervisors.length = 0
  state.workerSettings.length = 0
})

describe('useSigmaLayout 一次性布局', () => {
  it('circular 写回坐标并触发重绘', async () => {
    const { api, graph } = await mountLayout('circular')

    await api.assign()

    const positions = graph.nodes().map(n => graph.getNodeAttribute(n, 'x') as number)
    expect(new Set(positions).size).toBeGreaterThan(1)
    expect(state.refreshes).toBeGreaterThan(0)
  })

  it('random 与 circlepack 同样可用', async () => {
    for (const name of ['random', 'circlepack'] as const) {
      const { api, graph } = await mountLayout(name)
      await api.assign()
      expect(graph.nodes().every(n => typeof graph.getNodeAttribute(n, 'x') === 'number')).toBe(true)
    }
  })

  it('一次性布局不是迭代型，start 等价于 assign', async () => {
    const { api } = await mountLayout('circular')

    expect(api.isSupervised).toBe(false)
    await api.start()

    expect(state.supervisors).toHaveLength(0)
    expect(state.refreshes).toBeGreaterThan(0)
  })

  it('forceatlas2 在非 worker 模式下同步计算', async () => {
    const { api, graph } = await mountLayout('forceatlas2', { worker: false, iterations: 5 })

    await api.start()

    expect(state.supervisors).toHaveLength(0)
    expect(graph.nodes().every(n => Number.isFinite(graph.getNodeAttribute(n, 'x')))).toBe(true)
  })
})

describe('useSigmaLayout worker 生命周期', () => {
  it('forceatlas2 与 noverlap 是迭代型', async () => {
    expect((await mountLayout('forceatlas2')).api.isSupervised).toBe(true)
    expect((await mountLayout('noverlap')).api.isSupervised).toBe(true)
  })

  it('start 启动 worker 并反映运行状态', async () => {
    const { api } = await mountLayout('forceatlas2')

    await api.start()

    expect(state.supervisors[0]!.started).toBe(1)
    expect(api.isRunning.value).toBe(true)
  })

  it('stop 停止但不销毁，可再次启动', async () => {
    const { api } = await mountLayout('forceatlas2')

    await api.start()
    api.stop()
    expect(api.isRunning.value).toBe(false)
    expect(state.supervisors[0]!.killed).toBe(0)

    await api.start()
    expect(state.supervisors).toHaveLength(1)
    expect(state.supervisors[0]!.started).toBe(2)
  })

  it('作用域销毁时 kill worker，避免线程泄漏', async () => {
    const { api, wrapper } = await mountLayout('forceatlas2')

    await api.start()
    expect(state.supervisors[0]!.killed).toBe(0)

    wrapper.unmount()

    expect(state.supervisors[0]!.killed).toBe(1)
  })

  it('kill 后再 start 会重建 worker', async () => {
    const { api } = await mountLayout('forceatlas2')

    await api.start()
    api.kill()
    await api.start()

    expect(state.supervisors).toHaveLength(2)
    expect(api.isRunning.value).toBe(true)
  })

  it('settings 透传给 worker，并与推断出的默认值合并', async () => {
    const { api } = await mountLayout('forceatlas2', { settings: { gravity: 42 } })

    await api.start()

    expect(state.workerSettings[0]).toMatchObject({ settings: expect.objectContaining({ gravity: 42 }) })
  })
})

/** 分量的外接圆：圆心取包围盒中心，半径含节点自身的绘制半径 */
function measure(graph: Graph, keys: string[]) {
  const xs = keys.map(key => graph.getNodeAttribute(key, 'x') as number)
  const ys = keys.map(key => graph.getNodeAttribute(key, 'y') as number)
  const size = Math.max(...keys.map(key => Number(graph.getNodeAttribute(key, 'size')) || 1))

  const minX = Math.min(...xs) - size
  const minY = Math.min(...ys) - size
  const maxX = Math.max(...xs) + size
  const maxY = Math.max(...ys) + size

  return {
    center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
    radius: Math.hypot(maxX - minX, maxY - minY) / 2
  }
}

function groupKeys(graph: Graph, group: number): string[] {
  return graph.nodes().filter(key => key.startsWith(`c${group}-`))
}

describe('useSigmaLayout 按连通分量布局', () => {
  it('各分量的外接圆互不相交', async () => {
    const graph = makeComponentGraph()
    const { api } = await mountLayout('forceatlas2', { byComponent: true, iterations: 30 }, graph)

    await api.assign()

    const circles = [0, 1, 2].map(group => measure(graph, groupKeys(graph, group)))

    for (let i = 0; i < circles.length; i++) {
      for (let j = i + 1; j < circles.length; j++) {
        const a = circles[i]!
        const b = circles[j]!
        const distance = Math.hypot(a.center.x - b.center.x, a.center.y - b.center.y)
        expect(distance).toBeGreaterThan(a.radius + b.radius)
      }
    }
  })

  it('同一份数据连跑两次坐标一致', async () => {
    const first = makeComponentGraph()
    const second = makeComponentGraph()

    await (await mountLayout('forceatlas2', { byComponent: true, iterations: 30 }, first)).api.assign()
    await (await mountLayout('forceatlas2', { byComponent: true, iterations: 30 }, second)).api.assign()

    for (const key of first.nodes()) {
      expect(second.getNodeAttribute(key, 'x')).toBeCloseTo(first.getNodeAttribute(key, 'x') as number)
      expect(second.getNodeAttribute(key, 'y')).toBeCloseTo(first.getNodeAttribute(key, 'y') as number)
    }
  })

  it('单分量图退回整图布局', async () => {
    const graph = new Graph()
    for (let i = 0; i < 4; i++) {
      graph.addNode(`n${i}`, { x: Math.cos(i) * 10, y: Math.sin(i) * 10 })
    }
    graph.addEdge('n0', 'n1')
    graph.addEdge('n1', 'n2')
    graph.addEdge('n2', 'n3')

    const { api } = await mountLayout('forceatlas2', { byComponent: true, iterations: 30 }, graph)
    await api.assign()

    expect(graph.nodes().every(key => Number.isFinite(graph.getNodeAttribute(key, 'x')))).toBe(true)
  })

  it('与 worker 互斥：isSupervised 为 false，start 不创建 supervisor', async () => {
    const { api } = await mountLayout(
      'forceatlas2',
      { byComponent: true, iterations: 30 },
      makeComponentGraph()
    )

    expect(api.isSupervised).toBe(false)

    await api.start()

    expect(state.supervisors).toHaveLength(0)
    expect(api.isRunning.value).toBe(false)
  })
})

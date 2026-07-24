import Graph from 'graphology'
import { describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, shallowRef } from 'vue'
import { useSigmaGraph } from '../src/runtime/composables/use-sigma-graph'

/** 在独立作用域内运行，模拟组件的 setup 环境并可主动销毁 */
function inScope<T>(fn: () => T): { result: T, stop: () => void } {
  const scope = effectScope()
  const result = scope.run(fn)!
  return { result, stop: () => scope.stop() }
}

describe('useSigmaGraph', () => {
  it('图变更时 version 递增', async () => {
    const graph = new Graph()
    const { result, stop } = inScope(() => useSigmaGraph(graph))
    const initial = result.version.value

    graph.addNode('a')
    await nextTick()
    expect(result.version.value).toBe(initial + 1)

    graph.addNode('b')
    graph.addEdge('a', 'b')
    await nextTick()
    expect(result.version.value).toBe(initial + 3)

    stop()
  })

  it('属性更新也会递增 version', async () => {
    const graph = new Graph()
    graph.addNode('a', { size: 1 })
    const { result, stop } = inScope(() => useSigmaGraph(graph))
    const initial = result.version.value

    graph.setNodeAttribute('a', 'size', 2)
    await nextTick()

    expect(result.version.value).toBe(initial + 1)
    stop()
  })

  it('order 与 size 跟随图变更重算', async () => {
    const graph = new Graph()
    const { result, stop } = inScope(() => useSigmaGraph(graph))

    expect(result.order.value).toBe(0)
    expect(result.size.value).toBe(0)

    graph.addNode('a')
    graph.addNode('b')
    graph.addEdge('a', 'b')
    await nextTick()

    expect(result.order.value).toBe(2)
    expect(result.size.value).toBe(1)
    stop()
  })

  it('onGraphUpdate 在图变更时被调用', async () => {
    const graph = new Graph()
    const callback = vi.fn()
    const { result, stop } = inScope(() => {
      const bridge = useSigmaGraph(graph)
      bridge.onGraphUpdate(callback)
      return bridge
    })

    graph.addNode('a')
    await nextTick()

    expect(callback).toHaveBeenCalledOnce()
    expect(result.version.value).toBeGreaterThan(0)
    stop()
  })

  it('作用域销毁后解绑监听，不再响应图变更', async () => {
    const graph = new Graph()
    const { result, stop } = inScope(() => useSigmaGraph(graph))

    graph.addNode('a')
    await nextTick()
    const beforeStop = result.version.value

    stop()

    graph.addNode('b')
    await nextTick()

    expect(result.version.value).toBe(beforeStop)
  })

  it('图实例被替换后监听迁移到新实例', async () => {
    const first = new Graph()
    const second = new Graph()
    const source = shallowRef(first)

    const { result, stop } = inScope(() => useSigmaGraph(source))

    first.addNode('a')
    await nextTick()
    const afterFirst = result.version.value

    source.value = second
    await nextTick()

    second.addNode('b')
    await nextTick()
    expect(result.version.value).toBeGreaterThan(afterFirst)
    expect(result.order.value).toBe(1)

    // 旧实例不再驱动更新
    const beforeStale = result.version.value
    first.addNode('c')
    await nextTick()
    expect(result.version.value).toBe(beforeStale)

    stop()
  })
})

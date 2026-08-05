import type Graph from 'graphology'
import type { BaseGraphState, BaseNodeState, NodeDisplayData } from 'sigma/types'
import { describe, expect, it, vi } from 'vitest'
import { chainReducers } from '../src/runtime/utils/chain-reducers'
import type { SigmaReducer } from '../src/runtime/types'

type NodeReducer = SigmaReducer<NodeDisplayData, BaseNodeState>

const STATE = {} as BaseNodeState
const GRAPH_STATE = {} as BaseGraphState
const GRAPH = {} as Graph

/** 补齐 v4 reducer 的后四个参数，用例只关心 key 与 data */
function call(
  chained: NodeReducer | null,
  key: string,
  data: Partial<NodeDisplayData>
) {
  return chained?.(key, data as NodeDisplayData, {}, STATE, GRAPH_STATE, GRAPH)
}

describe('chainReducers', () => {
  it('全为空位时返回 null，对应 sigma 的「无归约」', () => {
    expect(chainReducers([])).toBeNull()
    expect(chainReducers([null, undefined])).toBeNull()
  })

  it('只有一条时也合并，返回补丁的归约不会丢掉坐标', () => {
    // sigma 拿归约的返回值当完整显示数据用，缺 x / y 会直接抛错。
    // 单条若原样透传，同一个归约函数在链上多一条同伴就换一种语义
    const reducer: NodeReducer = () => ({ size: 20 })
    const chained = chainReducers<NodeDisplayData, BaseNodeState>([null, reducer, undefined])

    expect(call(chained, 'n1', { x: 1, y: 2, label: 'N1' }))
      .toMatchObject({ x: 1, y: 2, label: 'N1', size: 20 })
  })

  it('按数组顺序执行，后者覆盖前者的同名字段', () => {
    const chained = chainReducers<NodeDisplayData, BaseNodeState>([
      (_key, data) => ({ ...data, color: '#111' }),
      () => ({ color: '#222' })
    ])

    expect(call(chained, 'n1', { label: 'N1' })).toMatchObject({ label: 'N1', color: '#222' })
  })

  it('后一个 reducer 拿到的是前序累积的结果', () => {
    // 累积对象在链内被复用以省下每环一次分配，断言必须在调用当时快照，
    // 直接比对引用会读到后续环改过的值
    const seen: Array<Record<string, unknown>> = []
    const second = vi.fn((_key: string, data: NodeDisplayData) => {
      seen.push({ ...data })
      return { size: Number(data.size) * 2 }
    })

    const chained = chainReducers<NodeDisplayData, BaseNodeState>([
      (_key, data) => ({ ...data, size: 5 }),
      second as NodeReducer
    ])

    const result = call(chained, 'n1', { size: 1 })

    expect(seen[0]).toMatchObject({ size: 5 })
    expect(result).toMatchObject({ size: 10 })
  })

  it('基座 reducer 位于链首且始终被调用', () => {
    const base = vi.fn((_key: string, data: NodeDisplayData) => ({ ...data, cursor: 'base' }))
    const overlay = vi.fn(() => ({ cursor: 'overlay' }))

    const chained = chainReducers<NodeDisplayData, BaseNodeState>([
      base as NodeReducer,
      overlay as NodeReducer
    ])
    const result = call(chained, 'n1', {})

    expect(base).toHaveBeenCalledOnce()
    expect(base.mock.invocationCallOrder[0]!).toBeLessThan(overlay.mock.invocationCallOrder[0]!)
    expect(result).toMatchObject({ cursor: 'overlay' })
  })

  it('不修改传入的原始 data', () => {
    const data = { label: 'N1' }
    const chained = chainReducers<NodeDisplayData, BaseNodeState>([
      (_key, incoming) => ({ ...incoming, color: '#111' }),
      () => ({ visibility: 'hidden' })
    ])

    call(chained, 'n1', data)

    expect(data).toEqual({ label: 'N1' })
  })

  it('把后四个参数原样转发给每一环', () => {
    const spy = vi.fn(() => ({}))
    const chained = chainReducers<NodeDisplayData, BaseNodeState>([
      spy as NodeReducer,
      () => ({})
    ])

    call(chained, 'n1', { label: 'N1' })

    expect(spy).toHaveBeenCalledWith(
      'n1',
      expect.objectContaining({ label: 'N1' }),
      {},
      STATE,
      GRAPH_STATE,
      GRAPH
    )
  })
})

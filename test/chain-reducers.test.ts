import type { NodeDisplayData } from 'sigma/types'
import { describe, expect, it, vi } from 'vitest'
import { chainReducers } from '../src/runtime/utils/chain-reducers'
import type { SigmaReducer } from '../src/runtime/types'

type NodeReducer = SigmaReducer<NodeDisplayData>

describe('chainReducers', () => {
  it('全为空位时返回 null，对应 sigma 的「无归约」', () => {
    expect(chainReducers([])).toBeNull()
    expect(chainReducers([null, undefined])).toBeNull()
  })

  it('只有一条时原样返回，不额外包装', () => {
    const reducer: NodeReducer = (_key, data) => data
    expect(chainReducers([null, reducer, undefined])).toBe(reducer)
  })

  it('按数组顺序执行，后者覆盖前者的同名字段', () => {
    const chained = chainReducers<NodeDisplayData>([
      (_key, data) => ({ ...data, color: '#111' }),
      () => ({ color: '#222' })
    ])

    expect(chained?.('n1', { label: 'N1' })).toMatchObject({ label: 'N1', color: '#222' })
  })

  it('后一个 reducer 拿到的是前序累积的结果', () => {
    const second = vi.fn((_key: string, data: Record<string, unknown>) => ({ size: Number(data.size) * 2 }))

    const chained = chainReducers<NodeDisplayData>([
      (_key, data) => ({ ...data, size: 5 }),
      second as NodeReducer
    ])

    const result = chained?.('n1', { size: 1 })

    expect(second).toHaveBeenCalledWith('n1', expect.objectContaining({ size: 5 }))
    expect(result).toMatchObject({ size: 10 })
  })

  it('基座 reducer 位于链首且始终被调用', () => {
    const base = vi.fn((_key: string, data: Record<string, unknown>) => ({ ...data, from: 'base' }))
    const overlay = vi.fn(() => ({ from: 'overlay' }))

    const chained = chainReducers<NodeDisplayData>([base as NodeReducer, overlay as NodeReducer])
    const result = chained?.('n1', {})

    expect(base).toHaveBeenCalledOnce()
    expect(base.mock.invocationCallOrder[0]!).toBeLessThan(overlay.mock.invocationCallOrder[0]!)
    expect(result).toMatchObject({ from: 'overlay' })
  })

  it('不修改传入的原始 data', () => {
    const data = { label: 'N1' }
    chainReducers<NodeDisplayData>([
      (_key, incoming) => ({ ...incoming, color: '#111' }),
      () => ({ hidden: true })
    ])?.('n1', data)

    expect(data).toEqual({ label: 'N1' })
  })
})

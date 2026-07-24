import { describe, expect, it } from 'vitest'
import { clamp, createRegistry } from '../src/runtime/utils/core-candidates'

describe('clamp', () => {
  it('把数值钳制到闭区间', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
    expect(clamp(0, 0, 0)).toBe(0)
  })
})

describe('createRegistry', () => {
  it('登记后可按 id 取回', () => {
    const registry = createRegistry<string>()
    registry.register('a', 'value-a')

    expect(registry.get('a')).toBe('value-a')
    expect(registry.has('a')).toBe(true)
    expect(registry.keys()).toEqual(['a'])
  })

  it('未登记的 id 返回 undefined', () => {
    const registry = createRegistry<string>()
    expect(registry.get('missing')).toBeUndefined()
    expect(registry.has('missing')).toBe(false)
  })

  it('注销函数移除对应条目', () => {
    const registry = createRegistry<string>()
    const unregister = registry.register('a', 'value-a')

    unregister()

    expect(registry.has('a')).toBe(false)
    expect(registry.keys()).toEqual([])
  })

  it('同 id 被覆盖后，旧的注销函数不误删新值', () => {
    const registry = createRegistry<string>()
    const unregisterOld = registry.register('a', 'old')
    registry.register('a', 'new')

    unregisterOld()

    expect(registry.get('a')).toBe('new')
  })
})

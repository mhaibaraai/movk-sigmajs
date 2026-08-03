import { describe, expect, it } from 'vitest'
import { rectsIntersect } from '../src/runtime/utils/label-anchor'
import { createLabelLayout } from '../src/runtime/utils/label-layout'
import type { SigmaLabelRect } from '../src/runtime/utils/label-anchor'

function rect(x: number, y: number, width = 20, height = 10): SigmaLabelRect {
  return { x, y, width, height }
}

describe('createLabelLayout', () => {
  it('互不重叠的矩形都能登记', () => {
    const layout = createLabelLayout()

    expect(layout.claim('a', rect(0, 0))).toBe(true)
    expect(layout.claim('b', rect(100, 100))).toBe(true)
  })

  it('与他人重叠时拒绝登记', () => {
    const layout = createLabelLayout()

    layout.claim('a', rect(0, 0))
    expect(layout.claim('b', rect(5, 5))).toBe(false)
  })

  it('跨格子的大矩形同样能被检出冲突', () => {
    const layout = createLabelLayout({ cellSize: 8 })

    layout.claim('a', rect(0, 0, 200, 4))
    expect(layout.claim('b', rect(150, 0, 20, 4))).toBe(false)
  })

  it('同一 owner 重复登记是覆盖而非追加', () => {
    const layout = createLabelLayout()

    expect(layout.claim('a', rect(0, 0))).toBe(true)
    // 换个位置再登记，旧矩形应当被摘除，不能跟自己冲突
    expect(layout.claim('a', rect(4, 4))).toBe(true)
    // 旧位置随之空出，别人可以占
    expect(layout.claim('b', rect(0, -8))).toBe(true)
  })

  it('occupy 无视冲突强行登记', () => {
    const layout = createLabelLayout()

    layout.claim('a', rect(0, 0))
    layout.occupy('b', rect(0, 0))

    expect(layout.claim('c', rect(0, 0))).toBe(false)
  })

  it('非有限的矩形既不登记也不通过', () => {
    const layout = createLabelLayout()

    expect(layout.claim('a', rect(Number.NaN, 0))).toBe(false)
    expect(layout.claim('b', rect(0, 0))).toBe(true)
  })

  it('resetFrame 释放占位但保留位置记忆', () => {
    const layout = createLabelLayout()

    layout.claim('a', rect(0, 0))
    layout.remember('a', 'top')
    layout.resetFrame()

    expect(layout.claim('b', rect(0, 0))).toBe(true)
    expect(layout.recall('a')).toBe('top')
  })

  it('clear 同时清空占位与位置记忆', () => {
    const layout = createLabelLayout()

    layout.claim('a', rect(0, 0))
    layout.remember('a', 'top')
    layout.clear()

    expect(layout.recall('a')).toBeUndefined()
    expect(layout.claim('b', rect(0, 0))).toBe(true)
  })

  it('连续多帧未出现的位置记忆被淘汰', () => {
    const layout = createLabelLayout({ memoryTtlFrames: 4 })

    layout.remember('stale', 'top')
    layout.remember('fresh', 'bottom')

    for (let frame = 0; frame < 12; frame += 1) {
      layout.resetFrame()
      layout.remember('fresh', 'bottom')
    }

    expect(layout.recall('stale')).toBeUndefined()
    expect(layout.recall('fresh')).toBe('bottom')
  })

  it('memoryTtlFrames 为 0 时不淘汰', () => {
    const layout = createLabelLayout({ memoryTtlFrames: 0 })

    layout.remember('stale', 'top')
    for (let frame = 0; frame < 50; frame += 1) {
      layout.resetFrame()
    }

    expect(layout.recall('stale')).toBe('top')
  })

  it('两份 layout 互不干扰', () => {
    const first = createLabelLayout()
    const second = createLabelLayout()

    first.claim('a', rect(0, 0))
    first.remember('a', 'top')

    expect(second.claim('a', rect(0, 0))).toBe(true)
    expect(second.recall('a')).toBeUndefined()
  })

  it('分桶判定与线性扫的结果一致', () => {
    // 线性伪随机，避免用例结果随机漂移
    let seed = 20260803
    const random = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648
      return seed / 2147483648
    }

    const layout = createLabelLayout({ cellSize: 24 })
    const accepted: SigmaLabelRect[] = []

    for (let i = 0; i < 400; i += 1) {
      const candidate = rect(
        Math.round(random() * 600 - 300),
        Math.round(random() * 600 - 300),
        Math.round(random() * 60) + 4,
        Math.round(random() * 20) + 4
      )
      const linear = accepted.every(other => !rectsIntersect(candidate, other))
      const bucketed = layout.claim(`n${i}`, candidate)

      expect(bucketed).toBe(linear)
      if (linear) {
        accepted.push(candidate)
      }
    }

    expect(accepted.length).toBeGreaterThan(0)
  })
})

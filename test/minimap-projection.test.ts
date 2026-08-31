import * as sigmaUtils from 'sigma/utils'
import { describe, expect, it } from 'vitest'
import { createMinimapProjection } from '../src/runtime/utils/minimap-projection'

const SQUARE_GRAPH = { width: 1, height: 1 }

function square(padding = 0) {
  return createMinimapProjection(sigmaUtils, { width: 140, height: 140 }, SQUARE_GRAPH, padding)
}

describe('createMinimapProjection', () => {
  it('翻转 y 轴：framed 的上方落在画布上方', () => {
    const projection = square()
    const top = projection.toCanvas({ x: 0.5, y: 1 })
    const bottom = projection.toCanvas({ x: 0.5, y: 0 })

    expect(top.y).toBeLessThan(bottom.y)
    expect(top.y).toBeCloseTo(0)
    expect(bottom.y).toBeCloseTo(140)
  })

  it('framed 单位方块铺满画布，四周留出 padding', () => {
    const projection = square(6)

    expect(projection.toCanvas({ x: 0, y: 1 })).toEqual({
      x: expect.closeTo(6),
      y: expect.closeTo(6)
    })
    expect(projection.toCanvas({ x: 1, y: 0 })).toEqual({
      x: expect.closeTo(134),
      y: expect.closeTo(134)
    })
  })

  it('padding 调大后内容整体内收', () => {
    const origin = { x: 0, y: 1 }
    const loose = square(2).toCanvas(origin)
    const tight = square(20).toCanvas(origin)

    expect(tight.x).toBeGreaterThan(loose.x)
    expect(tight.y).toBeGreaterThan(loose.y)
  })

  it('非正方形画布上仍等比且居中', () => {
    const projection = createMinimapProjection(
      sigmaUtils,
      { width: 200, height: 100 },
      SQUARE_GRAPH,
      0
    )
    const left = projection.toCanvas({ x: 0, y: 0.5 })
    const right = projection.toCanvas({ x: 1, y: 0.5 })
    const bottom = projection.toCanvas({ x: 0.5, y: 0 })
    const top = projection.toCanvas({ x: 0.5, y: 1 })

    expect(right.x - left.x).toBeCloseTo(bottom.y - top.y)
    expect((left.x + right.x) / 2).toBeCloseTo(100)
    expect((top.y + bottom.y) / 2).toBeCloseTo(50)
  })

  it('toFramed 是 toCanvas 的逆运算', () => {
    const projection = square(6)

    for (const point of [{ x: 0.1, y: 0.9 }, { x: 0.5, y: 0.5 }, { x: 1.4, y: -0.3 }]) {
      const roundTrip = projection.toFramed(projection.toCanvas(point))
      expect(roundTrip.x).toBeCloseTo(point.x)
      expect(roundTrip.y).toBeCloseTo(point.y)
    }
  })

  it('图退化成一个点或一条线时不产生 NaN', () => {
    for (const graphDimensions of [{ width: 1, height: 1 }, { width: 1000, height: 1 }]) {
      const projection = createMinimapProjection(
        sigmaUtils,
        { width: 140, height: 140 },
        graphDimensions,
        6
      )
      const point = projection.toCanvas({ x: 0.5, y: 0.5 })

      expect(Number.isFinite(point.x)).toBe(true)
      expect(Number.isFinite(point.y)).toBe(true)
    }
  })
})

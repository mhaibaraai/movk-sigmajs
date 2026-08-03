import { describe, expect, it } from 'vitest'
import { buildLabelAnchor, polygonExtent, rectsIntersect } from '../src/runtime/utils/label-anchor'
import type { SigmaLabelGeometry } from '../src/runtime/utils/label-anchor'

const geometry: SigmaLabelGeometry = {
  x: 100,
  y: 100,
  size: 10,
  width: 40,
  height: 12,
  gap: 4
}

describe('rectsIntersect', () => {
  it('重叠的矩形判为相交', () => {
    expect(rectsIntersect(
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 5, y: 5, width: 10, height: 10 }
    )).toBe(true)
  })

  it('边界相切不算相交', () => {
    expect(rectsIntersect(
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 10, y: 0, width: 10, height: 10 }
    )).toBe(false)

    expect(rectsIntersect(
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 0, y: 10, width: 10, height: 10 }
    )).toBe(false)
  })

  it('完全分离的矩形不相交', () => {
    expect(rectsIntersect(
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 50, y: 50, width: 10, height: 10 }
    )).toBe(false)
  })
})

describe('buildLabelAnchor', () => {
  it('上下方位横向居中，让位距离为半径加间距', () => {
    const bottom = buildLabelAnchor('bottom', geometry)
    expect(bottom.align).toBe('center')
    expect(bottom.baseline).toBe('top')
    expect(bottom.rect).toEqual({ x: 80, y: 114, width: 40, height: 12 })

    const top = buildLabelAnchor('top', geometry)
    expect(top.rect).toEqual({ x: 80, y: 74, width: 40, height: 12 })
  })

  it('左右方位纵向居中并端对齐', () => {
    const right = buildLabelAnchor('right', geometry)
    expect(right.align).toBe('left')
    expect(right.baseline).toBe('middle')
    expect(right.rect).toEqual({ x: 114, y: 94, width: 40, height: 12 })

    const left = buildLabelAnchor('left', geometry)
    expect(left.align).toBe('right')
    // 绘制原点贴在节点边缘，矩形则往左展开一整个文本宽度
    expect(left.x).toBe(86)
    expect(left.rect).toEqual({ x: 46, y: 94, width: 40, height: 12 })
  })

  it('gap 缺省时取 4', () => {
    const { gap: _gap, ...withoutGap } = geometry
    expect(buildLabelAnchor('bottom', withoutGap).rect.y).toBe(114)
  })

  it('extent 逐方位覆盖 size，未列出的方位仍取 size', () => {
    const anchor = buildLabelAnchor('bottom', { ...geometry, extent: { bottom: 30 } })
    expect(anchor.rect.y).toBe(134)

    const untouched = buildLabelAnchor('top', { ...geometry, extent: { bottom: 30 } })
    expect(untouched.rect.y).toBe(74)
  })
})

describe('polygonExtent', () => {
  it('边数小于 3 时退化为圆，四方位一律取 size', () => {
    expect(polygonExtent({ sides: 2 }, 10)).toEqual({ top: 10, bottom: 10, left: 10, right: 10 })
  })

  it('正方形不旋转时顶点正对四个方位，外延即外接半径', () => {
    const extent = polygonExtent({ sides: 4 }, 10)

    for (const value of Object.values(extent)) {
      expect(value).toBeCloseTo(10, 10)
    }
  })

  it('正方形旋转 45 度后边正对四个方位，外延收到内切半径', () => {
    const extent = polygonExtent({ sides: 4, rotation: Math.PI / 4 }, 10)

    for (const value of Object.values(extent)) {
      expect(value).toBeCloseTo(10 / Math.SQRT2, 10)
    }
  })

  it('正三角形不旋转时顶点朝右，上下外延不相等', () => {
    const extent = polygonExtent({ sides: 3 }, 10)

    expect(extent.right).toBeCloseTo(10, 10)
    // 另两个顶点在 120 度与 240 度，横向投影只有 -5
    expect(extent.left).toBeCloseTo(5, 10)
    expect(extent.top).not.toBeCloseTo(extent.right, 5)
  })

  it('外延不超过外接半径', () => {
    for (const sides of [3, 5, 6, 8]) {
      const extent = polygonExtent({ sides, rotation: 0.37 }, 10)

      for (const value of Object.values(extent)) {
        expect(value).toBeLessThanOrEqual(10 + 1e-9)
      }
    }
  })
})

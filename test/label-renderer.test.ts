import { describe, expect, it } from 'vitest'
import { createLabelRenderer } from '../src/runtime/utils/label-renderer'
import type { Settings } from 'sigma/settings'

/** 每个字符固定 10px 宽，位置断言因此可以直接算 */
const CHAR_WIDTH = 10

interface PaintedText {
  text: string
  x: number
  y: number
  align: string
  baseline: string
}

function createContext() {
  const filled: PaintedText[] = []
  const stroked: string[] = []
  const transforms: Array<{ x: number, y: number }> = []

  const context = {
    font: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    lineWidth: 0,
    lineJoin: 'miter',
    strokeStyle: '',
    fillStyle: '',
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    shadowBlur: 0,
    shadowColor: '',
    save() {},
    restore() {},
    beginPath() {},
    fill() {},
    arc() {},
    roundRect() {},
    rotate() {},
    translate(x: number, y: number) {
      transforms.push({ x, y })
    },
    measureText(text: string) {
      return { width: [...text].length * CHAR_WIDTH }
    },
    fillText(text: string, x: number, y: number) {
      filled.push({ text, x, y, align: context.textAlign, baseline: context.textBaseline })
    },
    strokeText(text: string) {
      stroked.push(text)
    }
  }

  return { context, filled, stroked, transforms }
}

const settings = {
  labelFont: 'sans-serif',
  labelSize: 12,
  labelWeight: 'normal',
  labelColor: { color: '#111111' },
  edgeLabelFont: 'sans-serif',
  edgeLabelSize: 10,
  edgeLabelWeight: 'normal',
  edgeLabelColor: { color: '#666666' }
} as unknown as Settings

type NodeData = Parameters<ReturnType<typeof createLabelRenderer>['drawNodeLabel']>[1]
type EdgeData = Parameters<ReturnType<typeof createLabelRenderer>['drawEdgeLabel']>[1]

function node(overrides: Record<string, unknown> = {}) {
  return {
    key: 'n1',
    label: 'AB',
    x: 100,
    y: 100,
    size: 10,
    color: '#000',
    ...overrides
  } as unknown as NodeData
}

describe('createLabelRenderer 节点标签', () => {
  it('没有 label 时什么都不画', () => {
    const renderer = createLabelRenderer()
    const { context, filled } = createContext()

    renderer.drawNodeLabel(context as never, node({ label: '' }), settings)

    expect(filled).toHaveLength(0)
  })

  it('按 maxChars 截断并补省略号', () => {
    const renderer = createLabelRenderer({ maxChars: 3 })
    const { context, filled } = createContext()

    renderer.drawNodeLabel(context as never, node({ label: '一二三四五' }), settings)

    expect(filled[0]!.text).toBe('一二三…')
  })

  it('maxChars 缺省时不截断', () => {
    const renderer = createLabelRenderer()
    const { context, filled } = createContext()

    renderer.drawNodeLabel(context as never, node({ label: '一二三四五' }), settings)

    expect(filled[0]!.text).toBe('一二三四五')
  })

  it('首选方位取自 labelPlacement', () => {
    const renderer = createLabelRenderer()
    const { context, filled } = createContext()

    renderer.drawNodeLabel(context as never, node({ labelPlacement: 'right' }), settings)

    expect(filled[0]).toMatchObject({ x: 114, y: 100, align: 'left', baseline: 'middle' })
  })

  it('首选方位被占时换到下一个候选', () => {
    const renderer = createLabelRenderer()
    const { context, filled } = createContext()

    renderer.drawNodeLabel(context as never, node({ key: 'a' }), settings)
    renderer.drawNodeLabel(context as never, node({ key: 'b' }), settings)

    // 默认候选序 bottom → top，两个节点完全重合，第二个只能落到上方
    expect(filled[0]).toMatchObject({ y: 114, baseline: 'top' })
    expect(filled[1]!.y).toBe(100 - 14 - 12)
  })

  it('上一帧采用的方位优先复用', () => {
    const renderer = createLabelRenderer()
    const { context, filled } = createContext()

    renderer.drawNodeLabel(context as never, node({ key: 'a' }), settings)
    renderer.drawNodeLabel(context as never, node({ key: 'b' }), settings)

    renderer.resetFrame()
    // 新的一帧里 b 先画：仍应回到上一帧的上方，而不是抢走默认的下方
    renderer.drawNodeLabel(context as never, node({ key: 'b' }), settings)

    expect(filled[2]!.y).toBe(filled[1]!.y)
  })

  it('四方位全被占且档位高于 forceTier 时跳过', () => {
    const renderer = createLabelRenderer({ forceTier: 0 })
    const { context, filled } = createContext()

    for (const key of ['a', 'b', 'c', 'd']) {
      renderer.drawNodeLabel(context as never, node({ key }), settings)
    }
    renderer.drawNodeLabel(context as never, node({ key: 'e', labelTier: 1 }), settings)

    expect(filled).toHaveLength(4)
  })

  it('档位不高于 forceTier 时无视冲突强行绘制', () => {
    const renderer = createLabelRenderer({ forceTier: 0 })
    const { context, filled } = createContext()

    for (const key of ['a', 'b', 'c', 'd']) {
      renderer.drawNodeLabel(context as never, node({ key }), settings)
    }
    renderer.drawNodeLabel(context as never, node({ key: 'e', labelTier: 0 }), settings)

    expect(filled).toHaveLength(5)
  })

  it('没有档位属性的节点一律不强绘', () => {
    const renderer = createLabelRenderer({ forceTier: 10 })
    const { context, filled } = createContext()

    for (const key of ['a', 'b', 'c', 'd']) {
      renderer.drawNodeLabel(context as never, node({ key }), settings)
    }
    renderer.drawNodeLabel(context as never, node({ key: 'e' }), settings)

    expect(filled).toHaveLength(4)
  })

  it('tiers 提供字号与字重，缺失的档位回落到 settings', () => {
    const renderer = createLabelRenderer({ tiers: { 0: { size: 18, weight: '700', color: '#ff0000' } } })
    const { context } = createContext()

    renderer.drawNodeLabel(context as never, node({ key: 'a', labelTier: 0 }), settings)
    expect(context.font).toBe('700 18px sans-serif')

    renderer.drawNodeLabel(context as never, node({ key: 'b', labelTier: 2, x: 400 }), settings)
    expect(context.font).toBe('normal 12px sans-serif')
  })

  it('extent 属性参与让位距离', () => {
    const renderer = createLabelRenderer()
    const { context, filled } = createContext()

    renderer.drawNodeLabel(context as never, node({ labelExtent: { bottom: 40 } }), settings)

    expect(filled[0]!.y).toBe(144)
  })

  it('halo 为 false 时不描边', () => {
    const renderer = createLabelRenderer({ halo: false })
    const { context, stroked } = createContext()

    renderer.drawNodeLabel(context as never, node(), settings)

    expect(stroked).toHaveLength(0)
  })

  it('默认带描边光晕', () => {
    const renderer = createLabelRenderer()
    const { context, stroked } = createContext()

    renderer.drawNodeLabel(context as never, node(), settings)

    expect(stroked).toEqual(['AB'])
  })
})

describe('createLabelRenderer 悬停', () => {
  it('展示完整名称并沿用上一帧的方位', () => {
    const renderer = createLabelRenderer({ maxChars: 2 })
    const { context, filled } = createContext()

    renderer.drawNodeLabel(context as never, node({ key: 'a', label: '一二三四' }), settings)
    renderer.drawNodeLabel(context as never, node({ key: 'b', label: '一二三四' }), settings)
    renderer.drawNodeHover(context as never, node({ key: 'b', label: '一二三四' }), settings)

    const hovered = filled.at(-1)!
    expect(hovered.text).toBe('一二三四')
    expect(hovered.y).toBe(filled[1]!.y)
  })

  it('没有 label 时只画一个圆形底衬', () => {
    const renderer = createLabelRenderer()
    const { context, filled } = createContext()

    renderer.drawNodeHover(context as never, node({ label: '' }), settings)

    expect(filled).toHaveLength(0)
  })
})

function edge(overrides: Record<string, unknown> = {}) {
  return { key: 'e1', label: 'AB', size: 1, ...overrides } as unknown as EdgeData
}

const source = { key: 'a', x: 0, y: 0, size: 10 } as never
const target = { key: 'b', x: 400, y: 0, size: 10 } as never

describe('createLabelRenderer 关系标签', () => {
  it('两端节点几乎贴在一起时不画', () => {
    const renderer = createLabelRenderer()
    const { context, filled } = createContext()

    renderer.drawEdgeLabel(
      context as never,
      edge(),
      { key: 'a', x: 0, y: 0, size: 10 } as never,
      { key: 'b', x: 15, y: 0, size: 10 } as never,
      settings
    )

    expect(filled).toHaveLength(0)
  })

  it('文本超出裸露线段时截断补省略号', () => {
    const renderer = createLabelRenderer()
    const { context, filled } = createContext()

    // 裸露段长 80px，每字 10px，最多容纳 8 个字符（含省略号）
    renderer.drawEdgeLabel(
      context as never,
      edge({ label: '一二三四五六七八九十' }),
      { key: 'a', x: 0, y: 0, size: 10 } as never,
      { key: 'b', x: 100, y: 0, size: 10 } as never,
      settings
    )

    expect(filled[0]!.text).toBe('一二三四五六七…')
  })

  it('截断后不足 minChars 时放弃绘制', () => {
    const renderer = createLabelRenderer({ edge: { minChars: 6 } })
    const { context, filled } = createContext()

    renderer.drawEdgeLabel(
      context as never,
      edge({ label: '一二三四五六七八' }),
      { key: 'a', x: 0, y: 0, size: 10 } as never,
      { key: 'b', x: 50, y: 0, size: 10 } as never,
      settings
    )

    expect(filled).toHaveLength(0)
  })

  it('候选比例被占时沿边换位', () => {
    const renderer = createLabelRenderer()
    const { context, transforms } = createContext()

    renderer.drawEdgeLabel(context as never, edge({ key: 'e1' }), source, target, settings)
    renderer.drawEdgeLabel(context as never, edge({ key: 'e2' }), source, target, settings)

    // 首选 0.5，冲突后退到 0.35：裸露段从 x=10 起、长 380
    expect(transforms[0]!.x).toBeCloseTo(200, 6)
    expect(transforms[1]!.x).toBeCloseTo(10 + 380 * 0.35, 6)
  })

  it('全部候选都冲突时仍在首选位绘制', () => {
    const renderer = createLabelRenderer()
    const { context, filled } = createContext()

    for (const key of ['e1', 'e2', 'e3', 'e4']) {
      renderer.drawEdgeLabel(context as never, edge({ key }), source, target, settings)
    }

    expect(filled).toHaveLength(4)
  })

  it('节点标签先登记，关系标签为它让位', () => {
    const renderer = createLabelRenderer()
    const { context, transforms } = createContext()

    // 节点标签压在边中点上方，占住 0.5 这个位置
    renderer.drawNodeLabel(
      context as never,
      node({ key: 'mid', label: 'AAAA', x: 200, y: -8, size: 2 }),
      settings
    )
    renderer.drawEdgeLabel(context as never, edge(), source, target, settings)

    expect(transforms[0]!.x).not.toBeCloseTo(200, 6)
  })
})

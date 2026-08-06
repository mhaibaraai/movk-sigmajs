import type Sigma from 'sigma'
import type { SDFAtlasManager } from 'sigma'
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_NODE_LABEL_ATLAS_FONT_SIZE, applyNodeLabelAtlasFontSize } from '../src/runtime/utils/node-label-atlas'

/** 只实现 workaround 用到的那几个成员，其余交给类型断言 */
class FakeAtlasManager {
  static ATLAS_UPDATED_EVENT = 'atlasUpdated'

  listeners = new Map<string, (() => void)[]>()
  destroyed = false
  fonts: string[] = []

  constructor(public options: { fontSize: number }) {}

  on(event: string, listener: () => void) {
    this.listeners.set(event, [...(this.listeners.get(event) ?? []), listener])
    return this
  }

  emit(event: string) {
    for (const listener of this.listeners.get(event) ?? []) {
      listener()
    }
  }

  destroy() {
    this.destroyed = true
  }
}

function createProgram(atlasFontSize: number) {
  const initial = new FakeAtlasManager({ fontSize: atlasFontSize })

  return {
    atlasFontSize,
    atlasNeedsUpdate: false,
    defaultFontKey: 'sans-serif-normal-normal',
    atlasManager: initial as unknown as SDFAtlasManager,
    labelGlyphCache: new Map<unknown, unknown>([['cached', 1]]),
    registerFont: vi.fn((family: string, weight = 'normal', style = 'normal') => `${family}-${weight}-${style}`)
  }
}

function createInstance(program: ReturnType<typeof createProgram>) {
  return { internals: { labelProgram: program } } as unknown as Sigma
}

describe('applyNodeLabelAtlasFontSize', () => {
  it('换掉图集并按新字号重建，旧 manager 被销毁', () => {
    const program = createProgram(128)
    const previous = program.atlasManager as unknown as FakeAtlasManager

    const applied = applyNodeLabelAtlasFontSize(
      createInstance(program),
      DEFAULT_NODE_LABEL_ATLAS_FONT_SIZE
    )

    expect(applied).toBe(true)
    expect(previous.destroyed).toBe(true)
    expect(program.atlasFontSize).toBe(64)
    expect((program.atlasManager as unknown as FakeAtlasManager).options.fontSize).toBe(64)
    expect(program.labelGlyphCache.size).toBe(0)
  })

  it('重新登记默认字体，缺省与 sigma 一致', () => {
    const program = createProgram(128)

    applyNodeLabelAtlasFontSize(createInstance(program), 64)

    expect(program.registerFont).toHaveBeenCalledWith('sans-serif', 'normal', 'normal')
    expect(program.defaultFontKey).toBe('sans-serif-normal-normal')
  })

  it('登记 primitives 里声明的字体', () => {
    const program = createProgram(128)

    applyNodeLabelAtlasFontSize(createInstance(program), 64, {
      family: 'OPPO Sans',
      weight: 'bold'
    })

    expect(program.registerFont).toHaveBeenCalledWith('OPPO Sans', 'bold', 'normal')
  })

  it('新图集的更新事件继续驱动纹理上传', () => {
    const program = createProgram(128)

    applyNodeLabelAtlasFontSize(createInstance(program), 64)
    ;(program.atlasManager as unknown as FakeAtlasManager).emit(FakeAtlasManager.ATLAS_UPDATED_EVENT)

    expect(program.atlasNeedsUpdate).toBe(true)
  })

  it('字号与现值相同时不动图集', () => {
    const program = createProgram(64)
    const previous = program.atlasManager

    expect(applyNodeLabelAtlasFontSize(createInstance(program), 64)).toBe(false)
    expect(program.atlasManager).toBe(previous)
    expect(program.labelGlyphCache.size).toBe(1)
  })

  it('字号非法或取不到标签程序时跳过', () => {
    const program = createProgram(128)

    expect(applyNodeLabelAtlasFontSize(createInstance(program), 0)).toBe(false)
    expect(applyNodeLabelAtlasFontSize(createInstance(program), Number.NaN)).toBe(false)
    expect(applyNodeLabelAtlasFontSize({} as Sigma, 64)).toBe(false)
    expect(program.atlasFontSize).toBe(128)
  })
})

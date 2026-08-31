import type Sigma from 'sigma'
import type { SDFAtlasManager } from 'sigma'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_NODE_LABEL_ATLAS_FONT_SIZE,
  DEFAULT_NODE_LABEL_ATLAS_MAX_TEXTURE_SIZE,
  applyNodeLabelAtlas,
  watchNodeLabelAtlasOverflow
} from '../src/runtime/utils/node-label-atlas'

/** 只实现 workaround 用到的那几个成员，其余交给类型断言 */
class FakeAtlasManager {
  static ATLAS_UPDATED_EVENT = 'atlasUpdated'

  listeners = new Map<string, ((payload?: unknown) => void)[]>()
  destroyed = false

  constructor(public options: { fontSize: number, maxTextureSize?: number }) {}

  on(event: string, listener: (payload?: unknown) => void) {
    this.listeners.set(event, [...(this.listeners.get(event) ?? []), listener])
    return this
  }

  off(event: string, listener: (payload?: unknown) => void) {
    this.listeners.set(event, (this.listeners.get(event) ?? []).filter(item => item !== listener))
    return this
  }

  emit(event: string, payload?: unknown) {
    for (const listener of this.listeners.get(event) ?? []) {
      listener(payload)
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

/** `maxTextureSizeLimit` 为空时不挂 `getWebGLContext`，模拟测试里被 mock 掉的 sigma */
function createInstance(program: ReturnType<typeof createProgram>, maxTextureSizeLimit?: number) {
  const instance: Record<string, unknown> = { internals: { labelProgram: program } }

  if (maxTextureSizeLimit !== undefined) {
    instance.getWebGLContext = () => ({
      MAX_TEXTURE_SIZE: 0x0D33,
      getParameter: (name: number) => (name === 0x0D33 ? maxTextureSizeLimit : undefined)
    })
  }

  return instance as unknown as Sigma
}

function currentManager(program: ReturnType<typeof createProgram>) {
  return program.atlasManager as unknown as FakeAtlasManager
}

describe('applyNodeLabelAtlas', () => {
  it('换掉图集并按新字号重建，旧 manager 被销毁', () => {
    const program = createProgram(128)
    const previous = currentManager(program)

    const applied = applyNodeLabelAtlas(createInstance(program), {
      fontSize: DEFAULT_NODE_LABEL_ATLAS_FONT_SIZE
    })

    expect(applied).toBe(true)
    expect(previous.destroyed).toBe(true)
    expect(program.atlasFontSize).toBe(64)
    expect(currentManager(program).options.fontSize).toBe(64)
    expect(program.labelGlyphCache.size).toBe(0)
  })

  it('省略参数时取默认字号与默认页边长', () => {
    const program = createProgram(128)

    expect(applyNodeLabelAtlas(createInstance(program))).toBe(true)
    expect(currentManager(program).options).toEqual({
      fontSize: DEFAULT_NODE_LABEL_ATLAS_FONT_SIZE,
      maxTextureSize: DEFAULT_NODE_LABEL_ATLAS_MAX_TEXTURE_SIZE
    })
  })

  it('maxTextureSize 透传给新图集', () => {
    const program = createProgram(128)

    applyNodeLabelAtlas(createInstance(program), { maxTextureSize: 4096 })

    expect(currentManager(program).options.maxTextureSize).toBe(4096)
  })

  it('maxTextureSize 超出 GL 上限时夹回去', () => {
    const program = createProgram(128)

    applyNodeLabelAtlas(createInstance(program, 4096), { maxTextureSize: 16384 })

    expect(currentManager(program).options.maxTextureSize).toBe(4096)
  })

  it('取不到 GL 上下文时原样透传', () => {
    const program = createProgram(128)

    applyNodeLabelAtlas(createInstance(program), { maxTextureSize: 16384 })

    expect(currentManager(program).options.maxTextureSize).toBe(16384)
  })

  it('重新登记默认字体，缺省与 sigma 一致', () => {
    const program = createProgram(128)

    applyNodeLabelAtlas(createInstance(program), { fontSize: 64 })

    expect(program.registerFont).toHaveBeenCalledWith('sans-serif', 'normal', 'normal')
    expect(program.defaultFontKey).toBe('sans-serif-normal-normal')
  })

  it('登记 primitives 里声明的字体', () => {
    const program = createProgram(128)

    applyNodeLabelAtlas(createInstance(program), { fontSize: 64 }, {
      family: 'OPPO Sans',
      weight: 'bold'
    })

    expect(program.registerFont).toHaveBeenCalledWith('OPPO Sans', 'bold', 'normal')
  })

  it('新图集的更新事件继续驱动纹理上传', () => {
    const program = createProgram(128)

    applyNodeLabelAtlas(createInstance(program), { fontSize: 64 })
    currentManager(program).emit(FakeAtlasManager.ATLAS_UPDATED_EVENT)

    expect(program.atlasNeedsUpdate).toBe(true)
  })

  it('字号与页边长都落在现值上时不动图集', () => {
    const program = createProgram(64)
    const previous = program.atlasManager

    expect(applyNodeLabelAtlas(createInstance(program), { fontSize: 64 })).toBe(false)
    expect(program.atlasManager).toBe(previous)
    expect(program.labelGlyphCache.size).toBe(1)
  })

  it('字号相同但页边长非默认时仍要换图集', () => {
    const program = createProgram(64)

    expect(applyNodeLabelAtlas(createInstance(program), { fontSize: 64, maxTextureSize: 4096 })).toBe(true)
    expect(currentManager(program).options.maxTextureSize).toBe(4096)
  })

  it('字号非法或取不到标签程序时跳过', () => {
    const program = createProgram(128)

    expect(applyNodeLabelAtlas(createInstance(program), { fontSize: 0 })).toBe(false)
    expect(applyNodeLabelAtlas(createInstance(program), { fontSize: Number.NaN })).toBe(false)
    expect(applyNodeLabelAtlas({} as Sigma, { fontSize: 64 })).toBe(false)
    expect(program.atlasFontSize).toBe(128)
  })

  it('页边长非法时回落到默认值', () => {
    const program = createProgram(128)

    applyNodeLabelAtlas(createInstance(program), { maxTextureSize: 0 })

    expect(currentManager(program).options.maxTextureSize).toBe(DEFAULT_NODE_LABEL_ATLAS_MAX_TEXTURE_SIZE)
  })
})

describe('watchNodeLabelAtlasOverflow', () => {
  let warn: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // spyOn 对已 mock 的方法返回同一个 mock，不清一次会带着上个用例的调用记录
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    warn.mockClear()
  })

  function emitPages(program: ReturnType<typeof createProgram>, pages: number) {
    currentManager(program).emit(FakeAtlasManager.ATLAS_UPDATED_EVENT, {
      textures: Array.from({ length: pages }, () => ({}) as ImageData),
      glyphCount: 640
    })
  }

  it('单页不告警', () => {
    const program = createProgram(64)

    watchNodeLabelAtlasOverflow(createInstance(program))
    emitPages(program, 1)

    expect(warn).not.toHaveBeenCalled()
  })

  it('翻页后只告警一次', () => {
    const program = createProgram(64)

    watchNodeLabelAtlasOverflow(createInstance(program))
    emitPages(program, 2)
    emitPages(program, 3)

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]?.[0]).toContain('字形图集翻页了')
  })

  it('取消之后不再告警', () => {
    const program = createProgram(64)

    watchNodeLabelAtlasOverflow(createInstance(program))()
    emitPages(program, 2)

    expect(warn).not.toHaveBeenCalled()
  })

  it('取不到标签程序时返回空操作', () => {
    expect(() => watchNodeLabelAtlasOverflow({} as Sigma)()).not.toThrow()
  })
})

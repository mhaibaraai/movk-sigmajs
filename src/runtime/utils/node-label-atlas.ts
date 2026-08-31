import type Sigma from 'sigma'
import type { SDFAtlasManager } from 'sigma'

/**
 * 节点标签字形图集的默认源字号。
 *
 * 与 sigma 的 `DEFAULT_SDF_ATLAS_OPTIONS.fontSize` 及边标签图集取值一致，
 * 只去掉节点标签程序额外乘上的 `devicePixelRatio`。
 */
export const DEFAULT_NODE_LABEL_ATLAS_FONT_SIZE = 64

/** 图集页边长的默认值，与 sigma 的 `DEFAULT_SDF_ATLAS_OPTIONS.maxTextureSize` 一致 */
export const DEFAULT_NODE_LABEL_ATLAS_MAX_TEXTURE_SIZE = 2048

/** 节点标签 SDF 字形图集的参数 */
export interface SigmaLabelAtlasOptions {
  /**
   * 字形烘进图集时的源字号，不是标签显示字号（后者在 `styles` 的 `labelSize`）
   * @defaultValue 64
   */
  fontSize?: number
  /**
   * 图集页边长。容量约 `floor(maxTextureSize / (fontSize + 18))²`，提高一档字形容量翻四倍，
   * 代价是离屏 canvas 与纹理的占用同比增长（2048² 约 16MB，4096² 约 64MB）。
   * 超出本机 GL 的 `MAX_TEXTURE_SIZE` 会被夹回去
   * @defaultValue 2048
   */
  maxTextureSize?: number
}

/** 图集字形的字体，缺省与 sigma 的节点标签程序一致 */
export interface NodeLabelAtlasFont {
  family?: string
  weight?: string
  style?: string
}

/**
 * 节点标签程序里与字形图集相关的部分。
 *
 * sigma 把 `internals` 标成 private，图集参数也没有构造选项，只能按结构取用。
 */
interface NodeLabelProgramLike {
  atlasFontSize: number
  atlasNeedsUpdate: boolean
  defaultFontKey: string
  atlasManager: SDFAtlasManager
  labelGlyphCache?: Map<unknown, unknown>
  registerFont: (family: string, weight?: string, style?: string) => string
}

/** `SDFAtlasManager` 的构造侧，从实例原型取回，免得再从 sigma 导入一次 */
type AtlasManagerConstructor = (new (options: { fontSize: number, maxTextureSize: number }) => SDFAtlasManager) & {
  ATLAS_UPDATED_EVENT: string
}

/** 图集更新事件的 payload，上游没导出这个类型 */
interface AtlasUpdatedPayload {
  textures: ImageData[]
  glyphCount: number
}

function getLabelProgram(instance: Sigma): NodeLabelProgramLike | undefined {
  return (instance as unknown as {
    internals?: { labelProgram?: NodeLabelProgramLike }
  }).internals?.labelProgram
}

function getAtlasManagerConstructor(atlasManager: SDFAtlasManager): AtlasManagerConstructor | undefined {
  const constructor = Object.getPrototypeOf(atlasManager)?.constructor
  return typeof constructor === 'function' ? constructor as AtlasManagerConstructor : undefined
}

/** 读本机 GL 的纹理边长上限，拿不到上下文（SSR 桩、测试里的 mock）时返回 `null` */
function readMaxTextureSize(instance: Sigma): number | null {
  const getContext = (instance as { getWebGLContext?: () => WebGL2RenderingContext }).getWebGLContext
  if (typeof getContext !== 'function') {
    return null
  }

  try {
    const gl = getContext.call(instance)
    const limit = gl?.getParameter(gl.MAX_TEXTURE_SIZE) as unknown
    return typeof limit === 'number' && limit > 0 ? limit : null
  }
  catch {
    return null
  }
}

function resolveMaxTextureSize(instance: Sigma, requested: number): number {
  const limit = readMaxTextureSize(instance)
  if (limit === null || requested <= limit) {
    return requested
  }

  if (import.meta.dev) {
    console.warn(`[@movk/sigma] labelAtlas.maxTextureSize 请求的 ${requested} 超出本机 GL 上限 ${limit}，已夹回 ${limit}`)
  }

  return limit
}

/**
 * 重建节点标签的 SDF 字形图集，把字号压回不随 `devicePixelRatio` 放大的取值，并按需放大图集页。
 *
 * sigma 的节点标签程序按 `64 × devicePixelRatio` 生成字形（边标签程序则固定 64）。
 * 2 倍屏上单个字形连同 buffer 占约 144px，2048² 的图集一页只装得下约 190 个；
 * 中文标签的字形集轻易超过这个数，游标于是翻到第二页，而 `updateAtlasTexture()`
 * 只上传 `textures[0]`——翻页那一步又会把它截成 1px 宽（`finalizeCurrentTexture()`
 * 在 `cursor.x === 0 && rowHeight === 0` 时算出的宽度就是 1）。结果是节点标签全部
 * 提交了绘制却一个字都不显示，边标签因字形少仍正常，1 倍屏也正常。
 *
 * 压回 64 后字形约 80px、一页可容约 600 个。字形集更大时再调 `maxTextureSize`，
 * 容量按边长平方增长。上游追踪见 https://github.com/jacomyal/sigma.js/issues/1552
 *
 * 必须在实例刚建好、尚未渲染时调用：此刻图集里只有默认字体、没有任何字形，
 * 换掉整个 manager 不会丢已生成的数据。
 *
 * 新 manager 的类从现有实例的原型取，不额外 import `SDFAtlasManager`——测试里
 * `vi.mock('sigma')` 的工厂只返回 `default`，多取一个命名导出会让所有挂载组件的用例报错。
 *
 * @param instance 刚创建的 sigma 实例
 * @param options 图集参数，省略的项取默认值
 * @param font 图集字形的字体，取 `primitives.nodes.label.font`
 * @returns 是否真的换过图集，参数与现值等价时为 `false`
 */
export function applyNodeLabelAtlas(
  instance: Sigma,
  options: SigmaLabelAtlasOptions = {},
  font: NodeLabelAtlasFont = {}
): boolean {
  const program = getLabelProgram(instance)
  if (!program) {
    return false
  }

  const fontSize = options.fontSize ?? DEFAULT_NODE_LABEL_ATLAS_FONT_SIZE
  if (!Number.isFinite(fontSize) || fontSize <= 0) {
    return false
  }

  const requested = options.maxTextureSize ?? DEFAULT_NODE_LABEL_ATLAS_MAX_TEXTURE_SIZE
  const maxTextureSize = Number.isFinite(requested) && requested > 0
    ? resolveMaxTextureSize(instance, requested)
    : DEFAULT_NODE_LABEL_ATLAS_MAX_TEXTURE_SIZE

  /*
   * 程序自建的图集恒是只传 `{ fontSize }` 建的，`maxTextureSize` 必为上游默认值，
   * 所以两项都落在现值上时换了也是同一份配置。少判一项就会漏掉「只改页边长」的情形。
   */
  if (program.atlasFontSize === fontSize && maxTextureSize === DEFAULT_NODE_LABEL_ATLAS_MAX_TEXTURE_SIZE) {
    return false
  }

  const AtlasManager = getAtlasManagerConstructor(program.atlasManager)
  if (!AtlasManager) {
    return false
  }

  program.atlasManager.destroy()

  const atlasManager = new AtlasManager({ fontSize, maxTextureSize })
  atlasManager.on(AtlasManager.ATLAS_UPDATED_EVENT, () => {
    program.atlasNeedsUpdate = true
  })

  program.atlasFontSize = fontSize
  program.atlasManager = atlasManager
  program.labelGlyphCache?.clear()
  program.defaultFontKey = program.registerFont(
    font.family || 'sans-serif',
    font.weight || 'normal',
    font.style || 'normal'
  )

  return true
}

/**
 * 监听字形图集更新，翻到第二页时告警一次。
 *
 * 上游只上传 `textures[0]`，翻页那一刻还会把它截成 1px 宽，症状是标签缺字甚至整体消失、
 * 控制台一行报错都没有。容量再大也可能被超，所以这条监听与字号、页边长都无关，恒挂。
 *
 * 只做告警，由调用方决定是否只在开发环境挂。要挂在 `applyNodeLabelAtlas()` 之后，
 * 否则监听的是那个已经被换掉的旧 manager。
 *
 * @param instance sigma 实例
 * @returns 取消监听
 */
export function watchNodeLabelAtlasOverflow(instance: Sigma): () => void {
  const noop = () => {}

  const atlasManager = getLabelProgram(instance)?.atlasManager
  if (!atlasManager) {
    return noop
  }

  const event = getAtlasManagerConstructor(atlasManager)?.ATLAS_UPDATED_EVENT
  if (!event) {
    return noop
  }

  let warned = false
  const listener = (payload: AtlasUpdatedPayload) => {
    if (warned || (payload?.textures?.length ?? 0) <= 1) {
      return
    }

    warned = true
    console.warn(
      `[@movk/sigma] 节点标签字形图集翻页了（已生成 ${payload.glyphCount} 个字形）。`
      + 'sigma 只上传第一页，标签会缺字甚至整体消失。'
      + '调大 labelAtlas.maxTextureSize 或调小 labelAtlas.fontSize。'
    )
  }

  atlasManager.on(event, listener)

  return () => {
    atlasManager.off(event, listener)
  }
}

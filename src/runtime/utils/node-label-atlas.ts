import type Sigma from 'sigma'
import type { SDFAtlasManager } from 'sigma'

/**
 * 节点标签字形图集的默认字号。
 *
 * 与 sigma 的 `DEFAULT_SDF_ATLAS_OPTIONS.fontSize` 及边标签图集取值一致，
 * 只去掉节点标签程序额外乘上的 `devicePixelRatio`。
 */
export const DEFAULT_NODE_LABEL_ATLAS_FONT_SIZE = 64

/** 图集字形的字体，缺省与 sigma 的节点标签程序一致 */
export interface NodeLabelAtlasFont {
  family?: string
  weight?: string
  style?: string
}

/**
 * 节点标签程序里与字形图集相关的部分。
 *
 * sigma 把 `internals` 标成 private，图集字号也没有构造选项，只能按结构取用。
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
type AtlasManagerConstructor = (new (options: { fontSize: number }) => SDFAtlasManager) & {
  ATLAS_UPDATED_EVENT: string
}

/**
 * 重建节点标签的 SDF 字形图集，把字号压回不随 `devicePixelRatio` 放大的取值。
 *
 * sigma 的节点标签程序按 `64 × devicePixelRatio` 生成字形（边标签程序则固定 64）。
 * 2 倍屏上单个字形连同 buffer 占约 144px，2048² 的图集一页只装得下约 190 个；
 * 中文标签的字形集轻易超过这个数，游标于是翻到第二页，而 `updateAtlasTexture()`
 * 只上传 `textures[0]`——翻页那一步又会把它截成 1px 宽（`finalizeCurrentTexture()`
 * 在 `cursor.x === 0 && rowHeight === 0` 时算出的宽度就是 1）。结果是节点标签全部
 * 提交了绘制却一个字都不显示，边标签因字形少仍正常，1 倍屏也正常。
 *
 * 压回 64 后字形约 80px、一页可容约 600 个，中文图谱不再翻页。SDF 是矢量距离场，
 * 源分辨率降一半对 12~24px 的显示字号没有可见影响。
 *
 * 必须在实例刚建好、尚未渲染时调用：此刻图集里只有默认字体、没有任何字形，
 * 换掉整个 manager 不会丢已生成的数据。
 *
 * 新 manager 的类从现有实例的原型取，不额外 import `SDFAtlasManager`——测试里
 * `vi.mock('sigma')` 的工厂只返回 `default`，多取一个命名导出会让所有挂载组件的用例报错。
 *
 * @param instance 刚创建的 sigma 实例
 * @param fontSize 图集字号，非正数直接跳过
 * @param font 图集字形的字体，取 `primitives.nodes.label.font`
 * @returns 是否真的换过图集，字号与现值相同时为 `false`
 */
export function applyNodeLabelAtlasFontSize(
  instance: Sigma,
  fontSize: number,
  font: NodeLabelAtlasFont = {}
): boolean {
  const program = (instance as unknown as {
    internals?: { labelProgram?: NodeLabelProgramLike }
  }).internals?.labelProgram

  if (!program || !Number.isFinite(fontSize) || fontSize <= 0) {
    return false
  }
  if (program.atlasFontSize === fontSize) {
    return false
  }

  const AtlasManager = Object.getPrototypeOf(program.atlasManager)?.constructor as AtlasManagerConstructor | undefined
  if (typeof AtlasManager !== 'function') {
    return false
  }

  program.atlasManager.destroy()

  const atlasManager = new AtlasManager({ fontSize })
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

import { buildLabelAnchor } from './label-anchor'
import { createLabelLayout } from './label-layout'
import type { SigmaLabelAnchor, SigmaLabelGeometry, SigmaLabelPlacement } from './label-anchor'
import type { SigmaLabelLayout } from './label-layout'
import type { EdgeLabelDrawingFunction, NodeHoverDrawingFunction, NodeLabelDrawingFunction } from 'sigma/rendering'
import type { Settings } from 'sigma/settings'

/** 一个标签档位的字形样式 */
export interface SigmaLabelTierStyle {
  /** 字号（px） */
  size: number
  /** canvas `font` 简写里的 font-weight 片段 */
  weight: string
  color: string
}

export interface SigmaLabelHaloOptions {
  /**
   * 光晕颜色，通常取画布底色
   * @defaultValue 'rgba(255, 255, 255, 0.95)'
   */
  color?: string
  /**
   * 光晕描边宽度（px）
   * @defaultValue 3
   */
  width?: number
}

export interface SigmaLabelHoverOptions {
  /**
   * 悬停底衬颜色
   * @defaultValue '#ffffff'
   */
  backdrop?: string
  /**
   * 底衬投影颜色
   * @defaultValue 'rgba(15, 23, 42, 0.25)'
   */
  shadowColor?: string
  /**
   * 底衬投影模糊半径
   * @defaultValue 8
   */
  shadowBlur?: number
  /**
   * 底衬相对文本框的内边距
   * @defaultValue 4
   */
  padding?: number
  /**
   * 底衬圆角
   * @defaultValue 4
   */
  radius?: number
}

export interface SigmaEdgeLabelOptions {
  /**
   * 沿边的候选位置，取值为从源点到目标点的比例，按序试到第一个不冲突的
   * @defaultValue `[0.5, 0.35, 0.65]`
   */
  ratios?: readonly number[]
  /**
   * 截断后不足这么多字符就放弃绘制——只剩一两个字的关系名没有信息量
   * @defaultValue 4
   */
  minChars?: number
}

export interface CreateLabelRendererOptions {
  /**
   * 共用的占位登记。多个渲染器需要互相避让时传同一份，缺省各自新建。
   * @see {@link createLabelLayout}
   */
  layout?: SigmaLabelLayout
  /**
   * 节点标签保留的最大字符数（按码点计），超出补省略号。0 表示不截断。
   *
   * 中文名普遍 20 字以上，不截断的话单条标签横向要占 250px，避让也腾不出位置。
   * @defaultValue 0
   */
  maxChars?: number
  /**
   * 标签与节点边缘的间距
   * @defaultValue 4
   */
  gap?: number
  /**
   * 文字描边光晕，传 `false` 关闭。用描边而非底衬，是因为成片的底衬会盖住画在下层的关系名
   * @defaultValue `{ color: 'rgba(255, 255, 255, 0.95)', width: 3 }`
   */
  halo?: SigmaLabelHaloOptions | false
  /**
   * 档位 → 字形样式。档位越低越重要，未列出的档位与缺失该属性的节点回落到 sigma 的
   * `labelSize` / `labelWeight` / `labelColor`。省略本项即所有标签同一套样式。
   */
  tiers?: Record<number, SigmaLabelTierStyle>
  /**
   * 读取节点档位的属性名
   * @defaultValue 'labelTier'
   */
  tierAttribute?: string
  /**
   * 读取节点首选方位的属性名，取值为 {@link SigmaLabelPlacement}
   * @defaultValue 'labelPlacement'
   */
  placementAttribute?: string
  /**
   * 读取节点各方位轮廓外延的属性名，非圆形节点用它让位
   * @defaultValue 'labelExtent'
   */
  extentAttribute?: string
  /**
   * 四个方位全被占满时仍强行绘制的最高档位（含）。档位高于它的标签直接跳过，
   * 密集场景因此优雅退化。没有档位属性的节点一律跳过。
   * @defaultValue 0
   */
  forceTier?: number
  /** 悬停态底衬的外观 */
  hover?: SigmaLabelHoverOptions
  /** 关系标签的候选位置与放弃阈值 */
  edge?: SigmaEdgeLabelOptions
}

export interface SigmaLabelRenderer {
  /** 交给 `settings.defaultDrawNodeLabel` */
  drawNodeLabel: NodeLabelDrawingFunction
  /** 交给 `settings.defaultDrawNodeHover` */
  drawNodeHover: NodeHoverDrawingFunction
  /** 交给 `settings.defaultDrawEdgeLabel` */
  drawEdgeLabel: EdgeLabelDrawingFunction
  /** 交给 sigma 的 `beforeRender` 事件 */
  resetFrame: () => void
  /** 重新布局后调用，清空占位与位置记忆 */
  clear: () => void
  /** 内部使用的占位登记，供多个渲染器共用 */
  layout: SigmaLabelLayout
}

/** 候选方位顺序：首选自身，其余先补上下再补左右——标签横向占位远宽于纵向 */
const PLACEMENT_CANDIDATES: Record<SigmaLabelPlacement, readonly SigmaLabelPlacement[]> = {
  bottom: ['bottom', 'top', 'right', 'left'],
  top: ['top', 'bottom', 'right', 'left'],
  right: ['right', 'left', 'bottom', 'top'],
  left: ['left', 'right', 'bottom', 'top']
}

const DEFAULT_HALO: Required<SigmaLabelHaloOptions> = {
  color: 'rgba(255, 255, 255, 0.95)',
  width: 3
}

const DEFAULT_HOVER: Required<SigmaLabelHoverOptions> = {
  backdrop: '#ffffff',
  shadowColor: 'rgba(15, 23, 42, 0.25)',
  shadowBlur: 8,
  padding: 4,
  radius: 4
}

const DEFAULT_EDGE_RATIOS = [0.5, 0.35, 0.65] as const

const DEFAULT_EDGE_MIN_CHARS = 4

const ELLIPSIS = '…'

/** 颜色配置指向的属性缺失时的兜底，与 sigma 内置实现一致 */
const FALLBACK_COLOR = '#000'

type LabelColorSetting = Settings['labelColor'] | Settings['edgeLabelColor']

/** 按码点截断并补省略号。中文下比按像素测量稳定，也不依赖 canvas 上下文 */
function truncate(text: string, maxChars: number): string {
  if (maxChars <= 0) {
    return text
  }

  const chars = [...text]

  return chars.length <= maxChars ? text : `${chars.slice(0, maxChars).join('')}${ELLIPSIS}`
}

/** 与 sigma 内置实现一致：配置了 attribute 就从数据里取，取不到再回落到 color */
function resolveColor(setting: LabelColorSetting, data: Record<string, unknown>): string {
  if (setting.attribute) {
    return String(data[setting.attribute] ?? setting.color ?? FALLBACK_COLOR)
  }

  return setting.color ?? FALLBACK_COLOR
}

/** 旋转后文本框的外接矩形，避让用轴对齐的包围盒判定即可 */
function rotatedRect(cx: number, cy: number, width: number, height: number, unitX: number, unitY: number) {
  const spanX = Math.abs(width * unitX) + Math.abs(height * unitY)
  const spanY = Math.abs(width * unitY) + Math.abs(height * unitX)

  return { x: cx - spanX / 2, y: cy - spanY / 2, width: spanX, height: spanY }
}

/** 与 sigma 内置的 `drawStraightEdgeLabel` 一致的旋转角，保证标签始终顺着边的方向 */
function resolveAngle(dx: number, dy: number, distance: number): number {
  if (dx > 0) {
    return dy > 0 ? Math.acos(dx / distance) : Math.asin(dy / distance)
  }

  return dy > 0 ? Math.acos(dx / distance) + Math.PI : Math.asin(dx / distance) + Math.PI / 2
}

/**
 * 二分出能塞进 `maxWidth` 的最长前缀并补省略号，短于 `minChars` 则返回空串。
 *
 * 逐字回退需要 O(n) 次 `measureText`，而每次测量都要走一遍字体排版，在标签密集的帧里很可观。
 */
function fitLabel(
  context: CanvasRenderingContext2D,
  label: string,
  maxWidth: number,
  minChars: number
): string {
  if (context.measureText(label).width <= maxWidth) {
    return label
  }

  const chars = [...label]
  let low = 0
  let high = chars.length

  while (low < high) {
    const mid = Math.ceil((low + high) / 2)
    const width = context.measureText(`${chars.slice(0, mid).join('')}${ELLIPSIS}`).width

    if (width <= maxWidth) {
      low = mid
    }
    else {
      high = mid - 1
    }
  }

  return low + 1 < minChars ? '' : `${chars.slice(0, low).join('')}${ELLIPSIS}`
}

/**
 * 创建一套会自行避让的标签绘制函数。
 *
 * sigma 只按标签网格粗筛哪些节点该出标签，具体位置固定在节点右侧且不截断，中文长名必然
 * 互相压盖。本渲染器在落笔前为每个标签登记占位矩形，冲突时依次改换方位（节点标签四方位、
 * 关系标签沿边三处），并跨帧记住实际采用的位置——每帧独立决策的话，相机一动方位就换。
 *
 * `resetFrame` 必须挂到 sigma 的 `beforeRender`，否则上一帧的占位不会释放。
 *
 * @example
 * ```ts
 * const labels = createLabelRenderer({ maxChars: 12 })
 *
 * const settings = {
 *   defaultDrawNodeLabel: labels.drawNodeLabel,
 *   defaultDrawNodeHover: labels.drawNodeHover,
 *   defaultDrawEdgeLabel: labels.drawEdgeLabel
 * }
 * ```
 */
export function createLabelRenderer(options: CreateLabelRendererOptions = {}): SigmaLabelRenderer {
  const {
    layout = createLabelLayout(),
    maxChars = 0,
    gap = 4,
    tiers,
    tierAttribute = 'labelTier',
    placementAttribute = 'labelPlacement',
    extentAttribute = 'labelExtent',
    forceTier = 0
  } = options

  const halo = options.halo === false ? null : { ...DEFAULT_HALO, ...options.halo }
  const hover = { ...DEFAULT_HOVER, ...options.hover }
  const edgeRatios = options.edge?.ratios ?? DEFAULT_EDGE_RATIOS
  const edgeMinChars = options.edge?.minChars ?? DEFAULT_EDGE_MIN_CHARS

  function readTier(data: Record<string, unknown>): number | null {
    const tier = data[tierAttribute]

    return typeof tier === 'number' && Number.isFinite(tier) ? tier : null
  }

  function applyFont(
    context: CanvasRenderingContext2D,
    style: SigmaLabelTierStyle,
    font: string
  ): void {
    context.font = `${style.weight} ${style.size}px ${font}`
  }

  function resolveStyle(
    data: Record<string, unknown>,
    settings: Settings
  ): SigmaLabelTierStyle {
    const tier = readTier(data)
    const style = tier === null ? undefined : tiers?.[tier]

    return style ?? {
      size: settings.labelSize,
      weight: settings.labelWeight,
      color: resolveColor(settings.labelColor, data)
    }
  }

  /** 上一帧的方位排在最前，其余按预计算方位的候选序补齐 */
  function orderCandidates(
    owner: string,
    placement: SigmaLabelPlacement | undefined
  ): readonly SigmaLabelPlacement[] {
    const candidates = PLACEMENT_CANDIDATES[placement ?? 'bottom'] ?? PLACEMENT_CANDIDATES.bottom
    const remembered = layout.recall(owner) as SigmaLabelPlacement | undefined

    if (!remembered || !candidates.includes(remembered)) {
      return candidates
    }

    return [remembered, ...candidates.filter(item => item !== remembered)]
  }

  function paintText(
    context: CanvasRenderingContext2D,
    text: string,
    anchor: SigmaLabelAnchor,
    color: string
  ): void {
    context.textAlign = anchor.align
    context.textBaseline = anchor.baseline

    if (halo) {
      context.lineWidth = halo.width
      context.lineJoin = 'round'
      context.strokeStyle = halo.color
      context.strokeText(text, anchor.x, anchor.y)
    }

    context.fillStyle = color
    context.fillText(text, anchor.x, anchor.y)
  }

  function geometryOf(
    data: Record<string, unknown>,
    x: number,
    y: number,
    size: number,
    width: number,
    height: number
  ): SigmaLabelGeometry {
    return {
      x,
      y,
      size,
      width,
      height,
      gap,
      extent: data[extentAttribute] as SigmaLabelGeometry['extent']
    }
  }

  const drawNodeLabel: NodeLabelDrawingFunction = (context, data, settings) => {
    if (!data.label) {
      return
    }

    const attributes = data as unknown as Record<string, unknown>
    const style = resolveStyle(attributes, settings)
    const text = truncate(data.label, maxChars)
    const owner = `node:${attributes.key as string}`

    context.save()
    applyFont(context, style, settings.labelFont)

    const geometry = geometryOf(
      attributes,
      data.x,
      data.y,
      data.size,
      context.measureText(text).width,
      style.size
    )
    const candidates = orderCandidates(owner, attributes[placementAttribute] as SigmaLabelPlacement | undefined)
    const taken = candidates.find(placement => layout.claim(owner, buildLabelAnchor(placement, geometry).rect))

    if (taken) {
      layout.remember(owner, taken)
      paintText(context, text, buildLabelAnchor(taken, geometry), style.color)
    }
    else {
      const tier = readTier(attributes)

      if (tier !== null && tier <= forceTier) {
        const fallback = buildLabelAnchor(candidates[0]!, geometry)

        layout.occupy(owner, fallback.rect)
        layout.remember(owner, candidates[0]!)
        paintText(context, text, fallback, style.color)
      }
    }

    context.restore()
  }

  const drawNodeHover: NodeHoverDrawingFunction = (context, data, settings) => {
    const attributes = data as unknown as Record<string, unknown>
    const style = resolveStyle(attributes, settings)

    context.save()
    context.shadowOffsetX = 0
    context.shadowOffsetY = 0
    context.shadowBlur = hover.shadowBlur
    context.shadowColor = hover.shadowColor
    context.fillStyle = hover.backdrop

    if (data.label) {
      applyFont(context, style, settings.labelFont)

      const owner = `node:${attributes.key as string}`
      // 位置取上一帧实际采用的方位，避免悬停瞬间跳位
      const placement = (layout.recall(owner)
        ?? attributes[placementAttribute]
        ?? 'bottom') as SigmaLabelPlacement
      // 悬停展示完整名称，不截断
      const geometry = geometryOf(
        attributes,
        data.x,
        data.y,
        data.size,
        context.measureText(data.label).width,
        style.size
      )
      const anchor = buildLabelAnchor(placement, geometry)

      context.beginPath()
      context.roundRect(
        anchor.rect.x - hover.padding,
        anchor.rect.y - hover.padding,
        anchor.rect.width + hover.padding * 2,
        anchor.rect.height + hover.padding * 2,
        hover.radius
      )
      context.fill()

      context.shadowBlur = 0
      paintText(context, data.label, anchor, style.color)
    }
    else {
      context.beginPath()
      context.arc(data.x, data.y, data.size + hover.padding / 2, 0, Math.PI * 2)
      context.fill()
    }

    context.restore()
  }

  const drawEdgeLabel: EdgeLabelDrawingFunction = (context, edgeData, sourceData, targetData, settings) => {
    if (!edgeData.label) {
      return
    }

    const attributes = edgeData as unknown as Record<string, unknown>
    const size = settings.edgeLabelSize

    // 去掉被节点圆盖住的两段，标签只在裸露的线段上找位置
    const rawX = targetData.x - sourceData.x
    const rawY = targetData.y - sourceData.y
    const rawDistance = Math.hypot(rawX, rawY)

    if (rawDistance < sourceData.size + targetData.size) {
      return
    }

    const sx = sourceData.x + (rawX * sourceData.size) / rawDistance
    const sy = sourceData.y + (rawY * sourceData.size) / rawDistance
    const dx = rawX - (rawX * (sourceData.size + targetData.size)) / rawDistance
    const dy = rawY - (rawY * (sourceData.size + targetData.size)) / rawDistance
    const distance = Math.hypot(dx, dy)

    context.save()
    context.font = `${settings.edgeLabelWeight} ${size}px ${settings.edgeLabelFont}`

    const label = fitLabel(context, edgeData.label, distance, edgeMinChars)

    if (!label) {
      context.restore()
      return
    }

    const width = context.measureText(label).width
    const unitX = dx / distance
    const unitY = dy / distance
    // 文本沿边的法线方向偏移，与 sigma 一致：基线落在线外 edgeData.size / 2 + size 处
    const offset = edgeData.size / 2 + size
    const centerOffset = offset - size / 2
    const owner = `edge:${attributes.key as string}`

    const rectAt = (ratio: number) => rotatedRect(
      sx + dx * ratio + centerOffset * -unitY,
      sy + dy * ratio + centerOffset * unitX,
      width,
      size,
      unitX,
      unitY
    )

    const remembered = Number(layout.recall(owner))
    const ratios = Number.isFinite(remembered)
      ? [remembered, ...edgeRatios.filter(ratio => ratio !== remembered)]
      : [...edgeRatios]

    const taken = ratios.find(ratio => layout.claim(owner, rectAt(ratio)))
    // 全部候选都冲突时仍在首选位绘制——关系名往往是图上唯一的语义来源
    const ratio = taken ?? ratios[0]!

    if (taken === undefined) {
      layout.occupy(owner, rectAt(ratio))
    }
    layout.remember(owner, String(ratio))

    context.translate(sx + dx * ratio, sy + dy * ratio)
    context.rotate(resolveAngle(dx, dy, distance))

    const color = resolveColor(settings.edgeLabelColor, attributes)

    if (halo) {
      context.lineWidth = halo.width
      context.lineJoin = 'round'
      context.strokeStyle = halo.color
      context.strokeText(label, -width / 2, offset)
    }

    context.fillStyle = color
    context.fillText(label, -width / 2, offset)
    context.restore()
  }

  return {
    drawNodeLabel,
    drawNodeHover,
    drawEdgeLabel,
    resetFrame: layout.resetFrame,
    clear: layout.clear,
    layout
  }
}

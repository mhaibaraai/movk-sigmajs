/** 标签相对节点的方位 */
export type SigmaLabelPlacement = 'top' | 'bottom' | 'left' | 'right'

/** 视口坐标系（y 轴向下）下的轴对齐矩形 */
export interface SigmaLabelRect {
  x: number
  y: number
  width: number
  height: number
}

/** 一次标签绘制所需的全部位置信息 */
export interface SigmaLabelAnchor {
  /** 占位矩形，用于帧内避让 */
  rect: SigmaLabelRect
  align: CanvasTextAlign
  baseline: CanvasTextBaseline
  /** 绘制原点的横坐标 */
  x: number
  /** 绘制原点的纵坐标 */
  y: number
}

export interface SigmaLabelGeometry {
  /** 节点中心的视口横坐标 */
  x: number
  /** 节点中心的视口纵坐标 */
  y: number
  /** 节点半径，非圆形节点取外接圆半径 */
  size: number
  /** 文本宽度，取 `context.measureText().width` */
  width: number
  /** 文本高度，取字号 */
  height: number
  /**
   * 标签与节点边缘的间距
   * @defaultValue 4
   */
  gap?: number
  /**
   * 各方位上节点轮廓到中心的实际距离，缺省的方位回落到 `size`。
   *
   * `size` 是外接圆半径，对圆形节点即真实轮廓；多边形节点在非顶点方向上的轮廓要近得多，
   * 一律按外接圆让位会让标签浮空，反之若按内切半径让位则顶点会戳进标签。
   * 正多边形的取值可由 {@link polygonExtent} 算出。
   */
  extent?: Partial<Record<SigmaLabelPlacement, number>>
}

export interface PolygonExtentOptions {
  /**
   * 正多边形的边数
   * @defaultValue 6
   */
  sides?: number
  /**
   * 整体旋转量（弧度），需与渲染程序的同名选项一致
   * @defaultValue 0
   */
  rotation?: number
}

const DEFAULT_GAP = 4

/**
 * 判断两个矩形是否相交。
 *
 * 边界相切**不算**相交：紧挨着的两个标签在视觉上并未压盖，判成冲突会让避让白白多挪一次。
 */
export function rectsIntersect(a: SigmaLabelRect, b: SigmaLabelRect): boolean {
  return a.x < b.x + b.width
    && b.x < a.x + a.width
    && a.y < b.y + b.height
    && b.y < a.y + a.height
}

/**
 * 按方位算出标签的占位矩形与绘制原点。
 *
 * 上下方位横向居中、纵向由节点边缘向外排；左右方位纵向居中、横向端对齐。
 * 四个方位的让位距离都是「该方位上的节点外延加间距」，外延默认取 `size`，
 * 非圆形节点经 `geometry.extent` 逐方位覆盖。
 */
export function buildLabelAnchor(
  placement: SigmaLabelPlacement,
  geometry: SigmaLabelGeometry
): SigmaLabelAnchor {
  const { x, y, size, width, height, gap = DEFAULT_GAP, extent } = geometry
  const offset = (extent?.[placement] ?? size) + gap

  switch (placement) {
    case 'top': {
      const top = y - offset - height
      return {
        rect: { x: x - width / 2, y: top, width, height },
        align: 'center',
        baseline: 'top',
        x,
        y: top
      }
    }
    case 'right': {
      const left = x + offset
      return {
        rect: { x: left, y: y - height / 2, width, height },
        align: 'left',
        baseline: 'middle',
        x: left,
        y
      }
    }
    case 'left': {
      const left = x - offset - width
      return {
        rect: { x: left, y: y - height / 2, width, height },
        align: 'right',
        baseline: 'middle',
        x: x - offset,
        y
      }
    }
    default: {
      const top = y + offset
      return {
        rect: { x: x - width / 2, y: top, width, height },
        align: 'center',
        baseline: 'top',
        x,
        y: top
      }
    }
  }
}

/**
 * 算出外接圆半径为 `size` 的正多边形在四个方位上的外延，供 `SigmaLabelGeometry.extent` 使用。
 *
 * 取各顶点在该方向上投影的最大值，也就是包围盒在这个方向上的半宽，而不是该方向射线打到
 * 轮廓上的距离。标签是一整条矩形、比节点宽得多，只按射线方向让位的话，轮廓在标签两端翘起来
 * 的部分仍会戳进文字里。边数小于 3 时退化为圆，四个方位一律返回 `size`。
 *
 * 坐标系与标签一致：y 轴向下，`rotation` 为顺时针弧度，与 `createNodeShapeProgram`
 * 的同名选项同义。因此正三角形在 `rotation` 为 0 时顶点朝右，上下两个方位的外延不相等。
 */
export function polygonExtent(
  options: PolygonExtentOptions,
  size: number
): Record<SigmaLabelPlacement, number> {
  const { sides = 6, rotation = 0 } = options

  if (sides < 3) {
    return { top: size, bottom: size, left: size, right: size }
  }

  let right = -Infinity
  let left = -Infinity
  let bottom = -Infinity
  let top = -Infinity

  for (let index = 0; index < sides; index += 1) {
    const angle = rotation + (index * 2 * Math.PI) / sides
    const vx = size * Math.cos(angle)
    const vy = size * Math.sin(angle)

    right = Math.max(right, vx)
    left = Math.max(left, -vx)
    bottom = Math.max(bottom, vy)
    top = Math.max(top, -vy)
  }

  return { top, bottom, left, right }
}

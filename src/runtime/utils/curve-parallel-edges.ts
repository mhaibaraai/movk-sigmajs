import type Graph from 'graphology'

export interface CurveParallelEdgesOptions {
  /**
   * 平行边使用的边类型名，需与 `programs.edge` 里注册的曲线程序同名
   * @defaultValue 'curved'
   */
  curvedType?: string
  /**
   * 非平行边使用的边类型名
   * @defaultValue 'straight'
   */
  straightType?: string
  /**
   * 写入曲率的属性名，需与 `createEdgeCurveProgram` 的 `curvatureAttribute` 一致
   * @defaultValue 'curvature'
   */
  curvatureAttribute?: string
}

/**
 * 曲率换算，与 sigma 官方 parallel-edges 示例一致。
 * 指数衰减让平行边数量增多时最外侧的曲率不至于失控。
 *
 * 官方实现在 `maxIndex <= 0` 时抛错；这里改为返回 0（即不弯），
 * 库不该因为一条退化数据就中断整张图的处理。
 */
function getCurvature(index: number, maxIndex: number, base: number): number {
  if (maxIndex <= 0) {
    return 0
  }

  if (index < 0) {
    return -getCurvature(-index, maxIndex, base)
  }

  const amplitude = 3.5
  const maxCurvature = amplitude * (1 - Math.exp(-maxIndex / amplitude)) * base

  return (maxCurvature * index) / maxIndex
}

/**
 * 给平行边与自环分配互不相同的曲率，避免多条边完全重叠。
 *
 * 分两步：先用 `@sigma/edge-curve` 的 `indexParallelEdgesIndex` 给每条边标出
 * `parallelIndex` / `parallelMinIndex` / `parallelMaxIndex`，再把索引换算成
 * `curvature` 并设置边的 `type`——只做第一步边是不会弯的，索引本身不参与渲染。
 *
 * 依赖可选 peer `@sigma/edge-curve`，用到时才动态加载：它与 sigma 本体一样
 * 在模块顶层读 WebGL 全局，静态 import 会让 SSR 直接崩。
 *
 * graphology 实例本就是可变数据结构，此处直接写属性是有意为之。
 */
export async function curveParallelEdges(
  graph: Graph,
  options: CurveParallelEdgesOptions = {}
): Promise<void> {
  const {
    curvedType = 'curved',
    straightType = 'straight',
    curvatureAttribute = 'curvature'
  } = options

  let indexParallelEdgesIndex: typeof import('@sigma/edge-curve').indexParallelEdgesIndex
  let defaultCurvature: number

  try {
    const module = await import('@sigma/edge-curve')
    indexParallelEdgesIndex = module.indexParallelEdgesIndex
    defaultCurvature = module.DEFAULT_EDGE_CURVATURE
  }
  catch {
    throw new Error('[@movk/sigma] curveParallelEdges() 需要可选依赖 @sigma/edge-curve，请先安装：pnpm add @sigma/edge-curve')
  }

  indexParallelEdgesIndex(graph)

  graph.forEachEdge((edge, attributes) => {
    const index = attributes.parallelIndex as number | null | undefined
    const minIndex = attributes.parallelMinIndex as number | null | undefined
    const maxIndex = attributes.parallelMaxIndex as number | null | undefined

    // 单条边不会被标记索引，直接走直线程序
    if (typeof index !== 'number' || typeof maxIndex !== 'number') {
      graph.setEdgeAttribute(edge, 'type', straightType)
      return
    }

    graph.mergeEdgeAttributes(edge, {
      // 有 minIndex 说明这组平行边关于中轴对称，居中那条（index 为 0）保持直线
      type: typeof minIndex === 'number' && index === 0 ? straightType : curvedType,
      [curvatureAttribute]: getCurvature(index, maxIndex, defaultCurvature)
    })
  })
}

import type { Coordinates, Dimensions } from 'sigma/types'

/**
 * sigma 的矩阵工具，由调用方注入。
 *
 * 运行时不能静态 import sigma 的值——它在模块顶层用 WebGL 常量建查找表，
 * 服务端加载会直接抛错，全仓库因此只对 sigma 用 `import type`。
 * `typeof import()` 取到的是类型，不产生运行时导入。
 */
export type SigmaMatrixUtils = Pick<typeof import('sigma/utils'), 'matrixFromCamera' | 'multiplyVec2'>

/** 相机复位状态：framed 单位方块正好铺满画布较短边，减去 padding */
const NULL_CAMERA_STATE = { x: 0.5, y: 0.5, angle: 0, ratio: 1 }

export interface MinimapProjection {
  /** framed 坐标 -> 缩略图画布像素 */
  toCanvas: (point: Coordinates) => Coordinates
  /** 缩略图画布像素 -> framed 坐标 */
  toFramed: (point: Coordinates) => Coordinates
}

/**
 * 建立 framed 坐标与缩略图画布像素之间的双向投影。
 *
 * framed 的 y 轴向上、canvas 2D 的 y 轴向下，两者还差一个等比缩放与长宽比修正。
 * 这些换算不自己推导：矩阵来自 sigma 公开导出的 `matrixFromCamera`，像素映射照抄
 * `Sigma#framedGraphToViewport` 与 `#viewportToFramedGraph`，与 sigma 渲染主画布
 * 时走的是同一套公式，版本升级时跟着一起变。
 *
 * 基准取 sigma 归一化后的 framed 单位方块而非节点包围盒：归一化保证所有节点都落在
 * `[0, 1]²` 内，于是缩放、拖拽、reducer 隐藏节点时缩略图上的点位恒定不漂。
 */
export function createMinimapProjection(
  utils: SigmaMatrixUtils,
  size: Dimensions,
  graphDimensions: Dimensions,
  padding: number
): MinimapProjection {
  const { width, height } = size
  const matrix = utils.matrixFromCamera(NULL_CAMERA_STATE, size, graphDimensions, padding)
  const invMatrix = utils.matrixFromCamera(NULL_CAMERA_STATE, size, graphDimensions, padding, true)

  return {
    toCanvas(point) {
      const projected = utils.multiplyVec2(matrix, point)
      return {
        x: (1 + projected.x) * width / 2,
        y: (1 - projected.y) * height / 2
      }
    },
    toFramed(point) {
      return utils.multiplyVec2(invMatrix, {
        x: point.x / width * 2 - 1,
        y: 1 - point.y / height * 2
      })
    }
  }
}

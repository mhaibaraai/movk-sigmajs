import type { AnimateOptions } from 'sigma/utils'
import type { CameraState, Coordinates } from 'sigma/types'
import { useSigma } from './use-sigma'

/**
 * 可用区的最小边长。
 *
 * 浮层是固定像素宽的，窗口收窄到一定程度后遮挡之和会吃掉整块舞台。可用区一旦归零，
 * 退远倍数就是 `Infinity`，相机拿到 NaN 后整张图直接消失，故保底一段可绘制的宽度。
 */
const MIN_STAGE_SIDE = 120

export interface SigmaFitInsets {
  /** 上方浮层的遮挡像素宽度 */
  top?: number
  /** 右侧浮层的遮挡像素宽度 */
  right?: number
  /** 下方浮层的遮挡像素宽度 */
  bottom?: number
  /** 左侧浮层的遮挡像素宽度 */
  left?: number
}

export interface SigmaFitOptions {
  /**
   * 是否动画过渡
   * @defaultValue true
   */
  animate?: boolean
  /**
   * 画布四周被浮层遮挡的像素宽度，fit 结果会落在扣掉遮挡后的可用区里。
   * 省略时行为与 `@sigma/utils` 的 `fitViewportToNodes` 完全一致
   */
  insets?: SigmaFitInsets
  /**
   * 相机比例下限。各邻域的空间尺度差异很大，紧凑的那些若任由 fit 收敛，
   * 比例会小到十几倍放大，观感是「一跳怼到脸上」。
   * 钳制发生在算居中偏移之前——交给 sigma 的 `minCameraRatio` 会让偏移量按未钳制的
   * 比例算、内容偏出可用区，而且那个设置会连手动滚轮放大一起挡住
   */
  minRatio?: number
}

/** 舞台上不被浮层遮挡的矩形，原点为舞台左上角 */
interface StageRect {
  x: number
  y: number
  width: number
  height: number
}

export interface UseSigmaCameraReturn {
  /** 放大，`factor` 为缩放倍数 */
  zoomIn: (options?: Partial<AnimateOptions> & { factor?: number }) => Promise<void>
  /** 缩小，`factor` 为缩放倍数 */
  zoomOut: (options?: Partial<AnimateOptions> & { factor?: number }) => Promise<void>
  /** 复位到初始视角 */
  reset: (options?: Partial<AnimateOptions>) => Promise<void>
  /** 移动到指定相机状态 */
  goto: (state: Partial<CameraState>, options?: Partial<AnimateOptions>) => Promise<void>
  /** 移动到指定节点，节点不存在或尚未渲染时不动 */
  gotoNode: (key: string, options?: Partial<AnimateOptions> & { ratio?: number }) => Promise<void>
  /** 调整视口容纳指定节点，省略则容纳全图；可扣掉浮层遮挡并钳制比例下限 */
  fitTo: (nodes?: string[], options?: SigmaFitOptions) => Promise<void>
  /** 当前相机状态，未就绪时为 `null` */
  getState: () => CameraState | null
  /**
   * 原始图坐标转屏幕坐标，未就绪时为 `null`。
   * 节点位置请用 `sigma.framedGraphToViewport(getNodeDisplayData(key))`，
   * 那套坐标已被 sigma 归一化，走这里会错位
   */
  toViewport: (point: Coordinates) => Coordinates | null
}

/**
 * 在一个轴上扣掉两侧遮挡，返回 `[起点, 长度]`。
 *
 * 遮挡之和挤没可用区时按两侧原有比例收缩并保底最小边长，可用区因此仍落在遮挡较少的那一边。
 */
function insetAxis(size: number, start: number, end: number): [number, number] {
  const room = size - MIN_STAGE_SIDE
  const total = start + end

  if (total <= room) {
    return [start, size - total]
  }
  // 窗口本身就不足最小边长，任何扣减都没有意义
  if (room <= 0) {
    return [0, size]
  }

  return [start * (room / total), MIN_STAGE_SIDE]
}

function resolveStageRect(width: number, height: number, insets: SigmaFitInsets): StageRect {
  const [x, rectWidth] = insetAxis(width, insets.left ?? 0, insets.right ?? 0)
  const [y, rectHeight] = insetAxis(height, insets.top ?? 0, insets.bottom ?? 0)

  return { x, y, width: rectWidth, height: rectHeight }
}

/**
 * 相机操作。全部基于原生 `sigma.getCamera()`，
 * 需要更底层的控制随时可以直接拿实例自己调。
 */
export function useSigmaCamera(): UseSigmaCameraReturn {
  const { sigma, whenReady } = useSigma()

  // @sigma/utils 是可选 peer，用到时才加载，未安装则给出可操作的提示
  async function loadSigmaUtils(): Promise<typeof import('@sigma/utils')> {
    try {
      return await import('@sigma/utils')
    }
    catch {
      throw new Error('[@movk/sigma] fitTo() 需要可选依赖 @sigma/utils，请先安装：pnpm add @sigma/utils')
    }
  }

  return {
    async zoomIn(options) {
      const instance = await whenReady()
      await instance.getCamera().animatedZoom(options)
    },

    async zoomOut(options) {
      const instance = await whenReady()
      await instance.getCamera().animatedUnzoom(options)
    },

    async reset(options) {
      const instance = await whenReady()
      await instance.getCamera().animatedReset(options)
    },

    async goto(state, options) {
      const instance = await whenReady()
      await instance.getCamera().animate(state, options)
    },

    async gotoNode(key, options) {
      const instance = await whenReady()
      const display = instance.getNodeDisplayData(key)

      if (!display) {
        return
      }

      // 这里直接把显示坐标交给相机，不做换算：getNodeDisplayData 返回的是归一化后的
      // framed 坐标，相机的 x / y 恰好也在这个坐标系（sigma 自己的 fitViewportToNodes 同样如此）。
      // 覆盖层那边要走 framedGraphToViewport，是因为目标坐标系是屏幕像素，两件事不要混淆
      const { ratio, ...animateOptions } = options ?? {}
      await instance.getCamera().animate(
        { x: display.x, y: display.y, ...(ratio === undefined ? {} : { ratio }) },
        animateOptions
      )
    },

    async fitTo(nodes, options) {
      const instance = await whenReady()
      const { animate = true, insets, minRatio } = options ?? {}
      const keys = nodes ?? instance.getGraph().nodes()

      if (keys.length === 0) {
        return
      }

      const utils = await loadSigmaUtils()

      // 无遮挡也无下限时走上游实现，行为一字不差
      if (!insets && minRatio === undefined) {
        await utils.fitViewportToNodes(instance, keys, { animate })
        return
      }

      const base = utils.getCameraStateToFitViewportToNodes(instance, keys)
      const { width, height } = instance.getDimensions()
      const rect = resolveStageRect(width, height, insets ?? {})

      // fit 只认整块舞台，按可用区相对整屏收缩的比例退远，内容才不会被浮层盖住
      const scale = Math.max(width / rect.width, height / rect.height)
      const state: CameraState = { ...base, ratio: Math.max(base.ratio * scale, minRatio ?? 0) }

      // 同一相机状态下两点的 framed 坐标之差即偏移量，换算交给 sigma 自己的矩阵
      const stageCenter = instance.viewportToFramedGraph(
        { x: width / 2, y: height / 2 },
        { cameraState: state }
      )
      const rectCenter = instance.viewportToFramedGraph(
        { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
        { cameraState: state }
      )

      const target: CameraState = {
        ...state,
        x: base.x + stageCenter.x - rectCenter.x,
        y: base.y + stageCenter.y - rectCenter.y
      }

      const camera = instance.getCamera()
      // 不能用 duration 0 的动画代替 setState：sigma 的动画循环会算出 NaN 进度
      if (animate) {
        await camera.animate(target)
      }
      else {
        camera.setState(target)
      }
    },

    getState() {
      return sigma.value?.getCamera().getState() ?? null
    },

    toViewport(point) {
      return sigma.value?.graphToViewport(point) ?? null
    }
  }
}

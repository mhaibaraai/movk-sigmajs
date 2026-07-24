import type { AnimateOptions } from 'sigma/utils'
import type { CameraState, Coordinates } from 'sigma/types'
import { useSigma } from './use-sigma'

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
  /** 调整视口容纳指定节点，省略则容纳全图 */
  fitTo: (nodes?: string[], options?: { animate?: boolean }) => Promise<void>
  /** 当前相机状态，未就绪时为 `null` */
  getState: () => CameraState | null
  /** 图坐标转屏幕坐标，未就绪时为 `null` */
  toViewport: (point: Coordinates) => Coordinates | null
}

/**
 * 相机操作。全部基于原生 `sigma.getCamera()`，
 * 需要更底层的控制随时可以直接拿实例自己调。
 */
export function useSigmaCamera(): UseSigmaCameraReturn {
  const { sigma, whenReady } = useSigma()

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

      const { ratio, ...animateOptions } = options ?? {}
      await instance.getCamera().animate(
        { x: display.x, y: display.y, ...(ratio === undefined ? {} : { ratio }) },
        animateOptions
      )
    },

    async fitTo(nodes, options) {
      const instance = await whenReady()

      // @sigma/utils 是可选 peer，用到时才加载，未安装则给出可操作的提示
      let fitViewportToNodes: typeof import('@sigma/utils').fitViewportToNodes
      try {
        ({ fitViewportToNodes } = await import('@sigma/utils'))
      }
      catch {
        throw new Error('[@movk/sigma] fitTo() 需要可选依赖 @sigma/utils，请先安装：pnpm add @sigma/utils')
      }

      await fitViewportToNodes(instance, nodes ?? instance.getGraph().nodes(), { animate: true, ...options })
    },

    getState() {
      return sigma.value?.getCamera().getState() ?? null
    },

    toViewport(point) {
      return sigma.value?.graphToViewport(point) ?? null
    }
  }
}

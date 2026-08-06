import { shallowRef } from 'vue'
import type { Ref } from 'vue'
import type { Settings } from 'sigma/settings'
import type { CameraState, PrimitivesDeclaration, StylesDeclaration } from 'sigma/types'
import { useSigma } from './use-sigma'

export interface SigmaExportOptions {
  /** 导出宽度，省略则用当前视口宽度 */
  width?: number
  /** 导出高度，省略则用当前视口高度 */
  height?: number
  /**
   * 背景色
   * @defaultValue 'transparent'
   */
  backgroundColor?: string
  /** 导出时的相机状态，省略则沿用当前视角 */
  cameraState?: CameraState
  /**
   * 只在这次导出生效的渲染覆盖。用于导出一套与屏幕不同的外观，
   * 例如去掉选中淡出、换成打印友好的配色
   */
  sigmaOverrides?: {
    primitives?: PrimitivesDeclaration
    styles?: StylesDeclaration
    settings?: Partial<Settings>
  }
}

export interface UseSigmaExportReturn {
  /** 是否正在导出 */
  isExporting: Readonly<Ref<boolean>>
  /** 导出为 PNG 的 Blob */
  toBlob: (options?: SigmaExportOptions) => Promise<Blob>
  /**
   * 导出并触发浏览器下载。`filename` 的 `.png` 后缀可写可不写，
   * 两种写法得到的文件名一致
   */
  download: (filename?: string, options?: SigmaExportOptions) => Promise<void>
}

/** 把当前画面导出为 PNG，依赖可选 peer `@sigma/export-image`，用到时才动态加载 */
export function useSigmaExport(): UseSigmaExportReturn {
  const { whenReady } = useSigma()
  const isExporting = shallowRef(false)

  async function load() {
    try {
      return await import('@sigma/export-image')
    }
    catch {
      throw new Error('[@movk/sigma] 导出需要可选依赖 @sigma/export-image，请先安装：pnpm add @sigma/export-image')
    }
  }

  function toImageOptions(options: SigmaExportOptions = {}) {
    return {
      ...(options.width === undefined ? {} : { width: options.width }),
      ...(options.height === undefined ? {} : { height: options.height }),
      ...(options.backgroundColor === undefined ? {} : { backgroundColor: options.backgroundColor }),
      ...(options.cameraState === undefined ? {} : { cameraState: options.cameraState }),
      ...(options.sigmaOverrides === undefined ? {} : { sigmaOverrides: options.sigmaOverrides })
    }
  }

  async function run<T>(task: () => Promise<T>): Promise<T> {
    isExporting.value = true
    try {
      return await task()
    }
    finally {
      isExporting.value = false
    }
  }

  return {
    isExporting,

    async toBlob(options) {
      const instance = await whenReady()
      const { toBlob } = await load()
      return run(() => toBlob(instance, toImageOptions(options)))
    },

    async download(filename = 'graph.png', options) {
      const instance = await whenReady()
      const { downloadAsPNG } = await load()
      // 上游按格式自行追加扩展名，先剥掉调用方带上的 .png，否则得到 graph.png.png
      const fileName = filename.replace(/\.png$/i, '')
      await run(() => downloadAsPNG(instance, { ...toImageOptions(options), fileName }))
    }
  }
}

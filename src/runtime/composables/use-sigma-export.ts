import { shallowRef } from 'vue'
import type { Ref } from 'vue'
import { useSigma } from './use-sigma'

export interface SigmaExportOptions {
  /** 导出宽度，省略则用当前视口宽度 */
  width?: number
  /** 导出高度，省略则用当前视口高度 */
  height?: number
  /** 背景色，省略则透明 */
  backgroundColor?: string
  /** 参与绘制的图层，省略则导出全部 */
  layers?: string[]
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

/**
 * 把当前画面导出为 PNG。
 *
 * 依赖可选 peer `@sigma/export-image`，用到时才动态加载：它与 sigma 本体一样
 * 在模块顶层读 WebGL 全局，静态 import 会让 SSR 直接崩。
 */
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

  /** layers 省略时传 null 而非 undefined，对应上游「全部图层」的取值 */
  function toImageOptions(options: SigmaExportOptions = {}) {
    return {
      layers: options.layers ?? null,
      width: options.width ?? null,
      height: options.height ?? null,
      ...(options.backgroundColor === undefined ? {} : { backgroundColor: options.backgroundColor })
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

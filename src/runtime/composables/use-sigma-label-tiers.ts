import { onScopeDispose, readonly, shallowRef, watch } from 'vue'
import type { Ref } from 'vue'
import { useSigma } from './use-sigma'

/** 相机比例断点：比例大于 `ratio` 时只显示不高于 `tier` 的档位 */
export type SigmaLabelTierBreakpoint = readonly [ratio: number, tier: number]

export interface UseSigmaLabelTiersOptions {
  /**
   * 相机比例断点，按 `ratio` 降序排列。`ratio` 越大视野越广、显示的标签越少。
   *
   * 自动 fit 之后相机比例通常落在 1 附近，默认值因此从 1.3 起跳
   * @defaultValue `[[2.6, 0], [1.3, 1]]`
   */
  breakpoints?: readonly SigmaLabelTierBreakpoint[]
  /**
   * 读取节点档位的属性名，通常由 `degreeToTier()` 写入
   * @defaultValue 'labelTier'
   */
  attribute?: string
}

export interface UseSigmaLabelTiersReturn {
  /** 当前允许显示的最低档位，所有断点都未命中时为 `Infinity`（即不限制） */
  tier: Readonly<Ref<number>>
}

const DEFAULT_BREAKPOINTS: readonly SigmaLabelTierBreakpoint[] = [[2.6, 0], [1.3, 1]]

/**
 * 按相机比例分级显示标签：视野越广，只留下越重要的那几档。
 *
 * 档位由节点属性给出，本 composable 只负责「当前该显示到哪一档」，库内规则据此把
 * 超档节点的 `labelVisibility` 置为 `'hidden'`，把同格名额让给更重要的节点。
 * 边标签跟着节点走——sigma 只在两端节点标签都显示时才画关系名。
 *
 * 不走 sigma 自带的 `labelRenderedSizeThreshold`：那个阈值比的是节点屏幕尺寸，而
 * `zoomToSizeRatioFunction: () => 1` 会让屏幕尺寸与缩放无关，阈值因此分不了级。
 */
export function useSigmaLabelTiers(options: UseSigmaLabelTiersOptions = {}): UseSigmaLabelTiersReturn {
  const { breakpoints = DEFAULT_BREAKPOINTS, attribute = 'labelTier' } = options

  const { whenReady, styleOptions } = useSigma()
  const tier = shallowRef(Number.POSITIVE_INFINITY)

  styleOptions.labelTierAttribute.value = attribute
  watch(tier, (next) => {
    styleOptions.labelTier.value = next
  }, { immediate: true })

  let detach: (() => void) | null = null
  let disposed = false

  whenReady().then((instance) => {
    if (disposed) {
      return
    }

    const camera = instance.getCamera()

    // 相机每次移动都会触发回调，仅在档位真正变化时才写 ref，避免逐帧重跑规则
    function sync() {
      const ratio = camera.ratio
      const next = breakpoints.find(([threshold]) => ratio > threshold)?.[1] ?? Number.POSITIVE_INFINITY

      if (next !== tier.value) {
        tier.value = next
      }
    }

    camera.on('updated', sync)
    sync()
    detach = () => camera.off('updated', sync)
  })

  onScopeDispose(() => {
    disposed = true
    detach?.()
    styleOptions.labelTier.value = Number.POSITIVE_INFINITY
  })

  return { tier: readonly(tier) }
}

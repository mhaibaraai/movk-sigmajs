import { onScopeDispose, readonly, shallowRef, watch } from 'vue'
import type { Ref } from 'vue'
import { useSigma } from './use-sigma'
import { useSigmaReducer } from './use-sigma-reducer'

/** 相机比例断点：比例大于 `ratio` 时只显示不高于 `tier` 的档位 */
export type SigmaLabelTierBreakpoint = readonly [ratio: number, tier: number]

export interface UseSigmaLabelTiersOptions {
  /**
   * 相机比例断点，按 `ratio` 降序排列。`ratio` 越大视野越广、显示的标签越少。
   *
   * 自动 fit 之后相机比例通常落在 1 附近，默认值因此从 1.3 起跳：默认视图标签全出，
   * 缩小一级掉最低档，再缩一级只剩最高档。
   * @defaultValue `[[2.6, 0], [1.3, 1]]`
   */
  breakpoints?: readonly SigmaLabelTierBreakpoint[]
  /**
   * 读取节点档位的属性名，与 `createLabelRenderer` 的 `tierAttribute` 一致
   * @defaultValue 'labelTier'
   */
  attribute?: string
  /**
   * reducer 链内次序
   * @defaultValue 100
   */
  order?: number
}

export interface UseSigmaLabelTiersReturn {
  /** 当前允许显示的最低档位，所有断点都未命中时为 `Infinity`（即不限制） */
  tier: Readonly<Ref<number>>
}

const DEFAULT_BREAKPOINTS: readonly SigmaLabelTierBreakpoint[] = [[2.6, 0], [1.3, 1]]

/**
 * 按相机比例分级显示标签：视野越广，只留下越重要的那几档。
 *
 * 档位由节点属性给出（通常来自 `degreeToTier()`），本 composable 只负责「当前该显示到哪一档」，
 * 并经 reducer 把超出档位的节点 `label` 置空。置空而非隐藏是有意的：sigma 的 `process()`
 * 用归约之后的 `label` 喂标签网格，置空的节点会把同格的名额让给更重要的节点。
 * 边标签跟着节点走——sigma 只在两端节点标签都显示时才画关系名。
 *
 * 不走 sigma 自带的 `labelRenderedSizeThreshold`：那个阈值比的是节点的屏幕尺寸，而
 * `zoomToSizeRatioFunction: () => 1` 会让屏幕尺寸与缩放无关，阈值因此分不了级。
 *
 * 相机每次移动都会触发回调，仅在档位真正变化时才写 ref，避免逐帧重跑归约。
 *
 * @example
 * ```ts
 * const { tier } = useSigmaLabelTiers({ breakpoints: [[2.6, 0], [1.3, 1]] })
 * ```
 */
export function useSigmaLabelTiers(options: UseSigmaLabelTiersOptions = {}): UseSigmaLabelTiersReturn {
  const {
    breakpoints = DEFAULT_BREAKPOINTS,
    attribute = 'labelTier',
    order = 100
  } = options

  const { whenReady } = useSigma()
  const tier = shallowRef(Number.POSITIVE_INFINITY)

  const { refresh } = useSigmaReducer({
    order,
    node(_key, _data, attributes) {
      const value = attributes[attribute]

      if (typeof value === 'number' && value > tier.value) {
        return { labelVisibility: 'hidden' }
      }

      return {}
    }
  })

  watch(tier, () => refresh())

  let detach: (() => void) | null = null
  let disposed = false

  whenReady().then((instance) => {
    if (disposed) {
      return
    }

    const camera = instance.getCamera()

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
  })

  return { tier: readonly(tier) }
}

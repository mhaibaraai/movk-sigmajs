import { toValue, watch } from 'vue'
import type { Settings } from 'sigma/settings'
import type { MaybeRefOrGetter } from 'vue'
import { useSigma } from './use-sigma'

/**
 * 把响应式的配置同步到 sigma。
 *
 * 配置对象整体透传给 `sigma.setSettings()`，不逐字段枚举也不过滤未知键，
 * sigma 新增的配置项无需本库升级即可使用。
 */
export function useSigmaSettings(source: MaybeRefOrGetter<Partial<Settings>>): void {
  const { sigma } = useSigma()

  watch(
    [sigma, () => toValue(source)],
    ([instance, settings]) => {
      instance?.setSettings(settings)
    },
    { immediate: true, deep: true }
  )
}

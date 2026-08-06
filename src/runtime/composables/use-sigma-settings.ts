import { toValue, watch } from 'vue'
import type { Settings } from 'sigma/settings'
import type { MaybeRefOrGetter } from 'vue'
import { useSigma } from './use-sigma'

/** 把响应式的配置整体透传给 `sigma.setSettings()` */
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

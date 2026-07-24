import { onScopeDispose, watch } from 'vue'
import type Sigma from 'sigma'
import type { SigmaEvents, SigmaEventType } from 'sigma/types'
import { useSigma } from './use-sigma'

export type SigmaEventHandlers = {
  [K in SigmaEventType]?: SigmaEvents[K]
}

/**
 * 声明式绑定 sigma 事件，作用域销毁时自动解绑。
 *
 * 接受任意 sigma 事件名，包括根组件 emits 未覆盖的；底层的 `sigma.on()` 也始终可用。
 * 实例尚未创建时会等待就绪后再绑定，实例被替换时自动迁移。
 */
export function useSigmaEvents(handlers: SigmaEventHandlers): void {
  const { sigma } = useSigma()

  let bound: Sigma | null = null

  function unbind() {
    if (!bound) {
      return
    }
    for (const [event, handler] of Object.entries(handlers)) {
      bound.off(event as SigmaEventType, handler)
    }
    bound = null
  }

  function bind(instance: Sigma) {
    unbind()
    for (const [event, handler] of Object.entries(handlers)) {
      instance.on(event as SigmaEventType, handler)
    }
    bound = instance
  }

  watch(sigma, (instance) => {
    if (instance) {
      bind(instance)
    }
    else {
      unbind()
    }
  }, { immediate: true })

  onScopeDispose(unbind)
}

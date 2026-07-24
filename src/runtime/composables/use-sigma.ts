import { inject } from 'vue'
import { createRegistry } from '../utils/core-candidates'
import { SIGMA_CONTEXT_KEY } from '../types'
import type { SigmaContext } from '../types'

const registry = createRegistry<SigmaContext>()

/**
 * 把上下文登记到全局注册表，供 `useSigmaById` 在组件树之外访问。
 * 由 `SigmaGraph` 内部调用，返回注销函数。
 */
export function registerSigma(id: string, context: SigmaContext): () => void {
  return registry.register(id, context)
}

/**
 * 注入当前 `SigmaGraph` 的上下文。
 *
 * 返回的 `sigma` 与 `graph` 是原生实例本身，不是 Proxy 也不是包装对象，
 * 任何 sigma / graphology 的原生方法都可直接调用。
 *
 * @throws 在 `SigmaGraph` 子树之外调用时抛错
 */
export function useSigma(): SigmaContext {
  const context = inject(SIGMA_CONTEXT_KEY, null)

  if (!context) {
    throw new Error('[@movk/sigma] useSigma() 必须在 <SigmaGraph> 的子树内调用；组件树之外请用 useSigmaById(id)')
  }

  return context
}

/**
 * 按 id 从全局注册表取上下文，用于组件树之外或跨路由访问。
 * 目标实例未挂载时返回 `undefined`。
 */
export function useSigmaById(id: string): SigmaContext | undefined {
  return registry.get(id)
}

/** 当前已挂载并登记了 id 的全部实例 */
export function useSigmaIds(): string[] {
  return registry.keys()
}

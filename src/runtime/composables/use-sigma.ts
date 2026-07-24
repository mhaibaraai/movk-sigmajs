import { createRegistry } from '@movk/core'
import { consola } from 'consola'
import { computed, inject, nextTick, toValue } from 'vue'
import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import { SIGMA_CONTEXT_KEY } from '../types'
import type { SigmaContext } from '../types'

/**
 * 实例注册表。
 *
 * `reactive` 让 `useSigmaById` 能在目标实例挂载后自动拿到它，而不是停留在首次查表的结果。
 * 底层是 `shallowReactive(Map)`，只追踪键的增删、不深度包装值——存进去的 `SigmaContext`
 * 取出来仍是原对象，`sigma` 与 `graph` 不会被代理，出口兼容的第一条红线得以保住。
 *
 * 重复 id 的告警不用注册表自带的 `onDuplicate`：它同步触发，会把「交接」误判成「冲突」，
 * 理由见 `registerSigma`。
 */
const registry = createRegistry<SigmaContext>({ reactive: true })

/** 已注销的上下文。用弱引用，不拖住被替换实例的回收 */
const retired = new WeakSet<SigmaContext>()

/**
 * 把上下文登记到全局注册表，供 `useSigmaById` 在组件树之外访问。
 * 由 `SigmaGraph` 内部调用，返回注销函数。
 *
 * 同 id 重复注册会告警，但**推迟一拍再判断**：组件被替换时（HMR 重载、路由切换、
 * 过渡动画）新实例在 setup 期就注册，旧实例要到 `onBeforeUnmount` 才注销，
 * 同步判断会把这种正常交接误报成冲突。等旧实例有机会注销后仍在册，才是真的两个实例抢同一个 id。
 */
export function registerSigma(id: string, context: SigmaContext): () => void {
  const previous = registry.get(id)
  const unregister = registry.register(id, context)

  if (import.meta.dev && previous && previous !== context) {
    nextTick(() => {
      if (!retired.has(previous)) {
        consola.warn(
          `[@movk/sigma] id "${id}" 同时被两个 SigmaGraph 占用，后挂载的实例已接管。useSigmaById("${id}") 取到的是后者`
        )
      }
    })
  }

  return () => {
    retired.add(context)
    unregister()
  }
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
 * 按 id 取上下文，用于组件树之外或跨路由访问。
 *
 * 返回计算属性而非一次性查表：调用方常在目标实例挂载之前就取好引用（跨路由、
 * 树外组件先于 `SigmaGraph` 渲染都很常见），实例就绪后引用会自动填上。
 * 目标未挂载或已卸载时其值为 `undefined`。
 */
export function useSigmaById(id: MaybeRefOrGetter<string>): ComputedRef<SigmaContext | undefined> {
  return computed(() => registry.get(toValue(id)))
}

/** 当前已挂载并登记了 id 的全部实例，随注册表增删自动更新 */
export function useSigmaIds(): ComputedRef<string[]> {
  return computed(() => registry.keys())
}

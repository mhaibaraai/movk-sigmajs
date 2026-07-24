import { onScopeDispose } from 'vue'
import { useSigma } from './use-sigma'
import type { SigmaReducerEntry } from '../types'

export interface UseSigmaReducerReturn {
  /** 重新合成 reducer 链并让 sigma 重绘。归约结果依赖的状态变化后调用 */
  refresh: () => void
}

/**
 * 往 reducer 链登记一条归约，作用域销毁时自动注销。
 *
 * sigma 的 `nodeReducer` / `edgeReducer` 各只接受一个函数，后设置的会覆盖先设置的，
 * 高亮、淡出、过滤、图例显隐这些独立关注点无法直接共存。链会按 `order` 升序执行，
 * 后者的返回值浅合并覆盖前者，用户经 `settings` 自带的 reducer 始终位于链首。
 *
 * 归约函数本身通常保持不变，变的是它闭包里的状态；那种情况下调用返回的 `refresh()`
 * 让 sigma 重跑归约。
 */
export function useSigmaReducer(entry: SigmaReducerEntry): UseSigmaReducerReturn {
  const { registerReducer, refreshReducers } = useSigma()

  onScopeDispose(registerReducer(entry))

  return { refresh: refreshReducers }
}

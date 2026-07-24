import type { Attributes } from 'graphology-types'
import type { SigmaReducer } from '../types'

/**
 * 把多个归约函数合成为单个，交给 sigma 的 `nodeReducer` / `edgeReducer`。
 *
 * sigma 各只接受一个 reducer，后设置的会覆盖先设置的。合成后按数组顺序依次执行，
 * 每个 reducer 拿到的是前序累积的结果，返回的字段浅合并进累积值。
 *
 * 传入的空位（`null` / `undefined`）会被跳过；全为空位时返回 `null`，
 * 正好是 sigma 对「无归约」的表示。
 */
export function chainReducers<D>(reducers: Array<SigmaReducer<D> | null | undefined>): SigmaReducer<D> | null {
  const active = reducers.filter((reducer): reducer is SigmaReducer<D> => typeof reducer === 'function')

  if (active.length === 0) {
    return null
  }

  if (active.length === 1) {
    return active[0]!
  }

  return (key, data) => active.reduce<Attributes>(
    (accumulated, reducer) => ({ ...accumulated, ...reducer(key, accumulated) }),
    { ...data }
  ) as Partial<D>
}

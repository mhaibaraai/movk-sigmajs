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
 *
 * 契约：归约函数收到的 `data` 是链内复用的累积对象，**只在本次调用内有效**。
 * 需要跨调用留存请自行复制，直接持有引用会读到后续环写入的值。
 * 调用方传入的原始对象不受影响，链在入口处已复制过一份。
 */
export function chainReducers<D>(reducers: Array<SigmaReducer<D> | null | undefined>): SigmaReducer<D> | null {
  const active = reducers.filter((reducer): reducer is SigmaReducer<D> => typeof reducer === 'function')

  if (active.length === 0) {
    return null
  }

  if (active.length === 1) {
    return active[0]!
  }

  // 合成后的函数每帧对每个节点与边各跑一次，是热路径。
  // 先复制一份入参，之后在副本上原地累积：调用方的 data 不受影响，
  // 对象分配从「每条 reducer 一个」降到「每次调用一个」
  return (key, data) => {
    const accumulated: Attributes = { ...data }

    for (const reducer of active) {
      Object.assign(accumulated, reducer(key, accumulated))
    }

    return accumulated as Partial<D>
  }
}

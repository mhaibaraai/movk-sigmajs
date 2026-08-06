import type { SigmaReducer } from '../types'

/**
 * 把多个归约函数合成为单个，交给 sigma 的 `nodeReducer` / `edgeReducer`。
 *
 * sigma 各只接受一个 reducer。合成后按数组顺序依次执行，每个 reducer 拿到的是前序
 * 累积的结果，返回的字段浅合并进累积值。
 *
 * 传入的空位（`null` / `undefined`）会被跳过；全为空位时返回 `null`。
 *
 * 契约：归约函数收到的 `data` 是链内复用的累积对象，**只在本次调用内有效**。
 * 需要跨调用留存请自行复制。调用方传入的原始对象不受影响，链在入口处已复制过一份。
 */
export function chainReducers<D extends object, S>(
  reducers: Array<SigmaReducer<D, S> | null | undefined>
): SigmaReducer<D, S> | null {
  const active = reducers.filter((reducer): reducer is SigmaReducer<D, S> => typeof reducer === 'function')

  if (active.length === 0) {
    return null
  }

  // 只有一条时也要合并，不能直接把它交给 sigma：
  // sigma 拿归约的返回值当完整显示数据用，缺 x / y 会直接抛错。链的契约是「返回补丁」，
  // 单条与多条必须一致，否则同一个归约函数在链上多一条同伴就换一种语义
  if (active.length === 1) {
    const only = active[0]!
    return (key, data, attributes, state, graphState, graph) => ({
      ...data,
      ...only(key, data, attributes, state, graphState, graph)
    } as Partial<D>)
  }

  // 合成后的函数每帧对每个节点与边各跑一次，是热路径。
  // 先复制一份入参，之后在副本上原地累积：调用方的 data 不受影响，
  // 对象分配从「每条 reducer 一个」降到「每次调用一个」
  return (key, data, attributes, state, graphState, graph) => {
    const accumulated = { ...data }

    for (const reducer of active) {
      Object.assign(accumulated, reducer(key, accumulated, attributes, state, graphState, graph))
    }

    return accumulated
  }
}

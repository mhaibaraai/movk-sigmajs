import type { Attributes } from 'graphology-types'
import type { Settings } from 'sigma/settings'
import type { EdgeDisplayData, NodeDisplayData } from 'sigma/types'

/**
 * 归约函数的通用形状。
 *
 * sigma 未把 `nodeReducer` / `edgeReducer` 的类型单独导出，只在 `Settings` 上以内联字段声明，
 * 因此这里从 `Settings` 派生而不是重写一份。
 */
export type SigmaReducer<D> = (key: string, data: Attributes) => Partial<D>

/** 节点归约函数，等价于 `Settings['nodeReducer']` 的非空形态 */
export type SigmaNodeReducer = NonNullable<Settings['nodeReducer']>

/** 边归约函数，等价于 `Settings['edgeReducer']` 的非空形态 */
export type SigmaEdgeReducer = NonNullable<Settings['edgeReducer']>

/**
 * reducer 链中的一条登记。sigma 各只接受一个 reducer，库内按 order 升序合成为单个函数。
 * 用户经 `settings` 直接传入的 reducer 以最低 order 作为链的基座。
 */
export interface SigmaReducerEntry {
  node?: SigmaReducer<NodeDisplayData>
  edge?: SigmaReducer<EdgeDisplayData>
  /**
   * 链内执行次序，升序执行，后者的返回值覆盖前者的同名字段
   * @defaultValue 0
   */
  order?: number
}

/** 内置布局算法名 */
export type SigmaLayoutName = 'forceatlas2' | 'noverlap' | 'circular' | 'circlepack' | 'random'

import type Graph from 'graphology'
import type { Attributes } from 'graphology-types'
import type Sigma from 'sigma'
import type { Settings } from 'sigma/settings'
import type { EdgeProgramType, NodeProgramType } from 'sigma/rendering'
import type { EdgeDisplayData, NodeDisplayData, SigmaEventType } from 'sigma/types'
import type { InjectionKey, Ref, ShallowRef } from 'vue'

/** 归约函数的通用形状 */
export type SigmaReducer<D> = (key: string, data: Attributes) => Partial<D>

/** 节点归约函数，等价于 `Settings['nodeReducer']` 的非空形态 */
export type SigmaNodeReducer = NonNullable<Settings['nodeReducer']>

/** 边归约函数，等价于 `Settings['edgeReducer']` 的非空形态 */
export type SigmaEdgeReducer = NonNullable<Settings['edgeReducer']>

/** reducer 链中的一条登记 */
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

/** `defineSigmaProgram()` 的产物，组件会在创建实例前解析它 */
export interface SigmaLazyProgram<T> {
  __sigmaLazyProgram: () => T | Promise<T>
}

/** 渲染程序，或一个延迟加载它的声明 */
export type SigmaProgramSource<T> = T | SigmaLazyProgram<T>

/**
 * 自定义渲染程序。接受任何符合官方程序类型的实现，
 * 不限于 `@sigma/*` 官方包，也不维护白名单。
 *
 * `@sigma/*` 程序包必须经 `defineSigmaProgram()` 延迟加载。
 */
export interface SigmaPrograms {
  node?: Record<string, SigmaProgramSource<NodeProgramType>>
  edge?: Record<string, SigmaProgramSource<EdgeProgramType>>
}

/**
 * 根组件下发的上下文。`sigma` 与 `graph` 都是原生实例，不做任何代理或包装。
 */
export interface SigmaContext {
  /** 原生 Sigma 实例。SSR 阶段与挂载完成前为 `null` */
  sigma: ShallowRef<Sigma | null>
  /** 原生 graphology 实例，始终存在 */
  graph: ShallowRef<Graph>
  /** 实例是否已创建 */
  isReady: Readonly<Ref<boolean>>
  /** 等待实例就绪，已就绪时立即兑现 */
  whenReady: () => Promise<Sigma>
  /**
   * 往 reducer 链登记一条，返回注销函数。
   * 由 `useSigmaReducer()` 调用，通常不必直接使用
   */
  registerReducer: (entry: SigmaReducerEntry) => () => void
  /** 重新合成 reducer 链并让 sigma 重绘 */
  refreshReducers: () => void
}

export const SIGMA_CONTEXT_KEY: InjectionKey<SigmaContext> = Symbol('movk-sigma')

/**
 * sigma 事件名的完整登记表。
 *
 * sigma 只在类型层枚举事件，运行期拿不到名字列表，只能自己维护一份。写成
 * `Record<SigmaEventType, true>` 而非数组，是为了让漏写与多写都在类型检查时失败：
 * sigma 升级新增事件时这份登记不会悄悄落后。
 */
const SIGMA_EVENT_FLAGS: Record<SigmaEventType, true> = {
  clickStage: true,
  doubleClickStage: true,
  rightClickStage: true,
  wheelStage: true,
  downStage: true,
  upStage: true,
  enterStage: true,
  leaveStage: true,
  clickNode: true,
  doubleClickNode: true,
  rightClickNode: true,
  wheelNode: true,
  downNode: true,
  upNode: true,
  enterNode: true,
  leaveNode: true,
  clickEdge: true,
  doubleClickEdge: true,
  rightClickEdge: true,
  wheelEdge: true,
  downEdge: true,
  upEdge: true,
  enterEdge: true,
  leaveEdge: true,
  beforeClear: true,
  afterClear: true,
  beforeProcess: true,
  afterProcess: true,
  beforeRender: true,
  afterRender: true,
  resize: true,
  kill: true,
  moveBody: true
}

/** sigma 的全部事件名，供批量绑定 */
export const SIGMA_EVENTS = Object.keys(SIGMA_EVENT_FLAGS) as SigmaEventType[]

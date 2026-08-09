import type Graph from 'graphology'
import type { Attributes } from 'graphology-types'
import type Sigma from 'sigma'
import type { PrimitivesDeclaration } from 'sigma/primitives'
import type {
  BaseEdgeState,
  BaseGraphState,
  BaseNodeState,
  EdgeDisplayData,
  EdgeReducer,
  NodeDisplayData,
  NodeReducer,
  SigmaEventType
} from 'sigma/types'
import type { InjectionKey, Ref, ShallowRef } from 'vue'

/**
 * 归约函数的通用形状，参数与 v4 的 `NodeReducer` / `EdgeReducer` 对齐。
 * 与官方的区别只在返回值语义：链内每条返回的是补丁，由链负责合并成完整显示数据
 */
export type SigmaReducer<D, S> = (
  key: string,
  data: D,
  attributes: Attributes,
  state: S,
  graphState: BaseGraphState,
  graph: Graph
) => Partial<D>

/** 节点归约函数，v4 直接导出，无需从 Settings 派生 */
export type SigmaNodeReducer = NodeReducer

/** 边归约函数 */
export type SigmaEdgeReducer = EdgeReducer

/** reducer 链中的一条登记 */
export interface SigmaReducerEntry {
  node?: SigmaReducer<NodeDisplayData, BaseNodeState>
  edge?: SigmaReducer<EdgeDisplayData, BaseEdgeState>
  /**
   * 链内执行次序，升序执行，后者的返回值覆盖前者的同名字段
   * @defaultValue 0
   */
  order?: number
}

/** 内置布局算法名 */
export type SigmaLayoutName = 'forceatlas2' | 'noverlap' | 'circular' | 'circlepack' | 'random'

/** `defineSigmaPrimitives()` 的产物，组件会在创建实例前解析它 */
export interface SigmaLazyPrimitives {
  __sigmaLazyPrimitives: () => PrimitivesDeclaration | Promise<PrimitivesDeclaration>
}

/** 渲染原语，或一个延迟加载它的声明 */
export type SigmaPrimitivesSource = PrimitivesDeclaration | SigmaLazyPrimitives

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
  /** 让 sigma 重跑归约并重绘 */
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
  clickNodeLabel: true,
  doubleClickNodeLabel: true,
  rightClickNodeLabel: true,
  wheelNodeLabel: true,
  downNodeLabel: true,
  upNodeLabel: true,
  enterNodeLabel: true,
  leaveNodeLabel: true,
  clickEdgeLabel: true,
  doubleClickEdgeLabel: true,
  rightClickEdgeLabel: true,
  wheelEdgeLabel: true,
  downEdgeLabel: true,
  upEdgeLabel: true,
  enterEdgeLabel: true,
  leaveEdgeLabel: true,
  beforeClear: true,
  afterClear: true,
  beforeProcess: true,
  afterProcess: true,
  beforeRender: true,
  afterRender: true,
  // 纹理上传完毕，供外部 GPU 数据写入方接管（如 @sigma/layout-fa2-gpu）
  afterTexturesUpload: true,
  resize: true,
  kill: true,
  moveBody: true,
  nodeDragStart: true,
  nodeDrag: true,
  nodeDragEnd: true
}

/** sigma 的全部事件名，供批量绑定 */
export const SIGMA_EVENTS = Object.keys(SIGMA_EVENT_FLAGS) as SigmaEventType[]

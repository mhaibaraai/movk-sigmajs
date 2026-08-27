import type Graph from 'graphology'
import type Sigma from 'sigma'
import type { PrimitivesDeclaration } from 'sigma/primitives'
import type { SigmaEventType, StylesDeclaration } from 'sigma/types'
import type { InjectionKey, Ref, ShallowRef } from 'vue'

/** 内置布局算法名 */
export type SigmaLayoutName = 'forceatlas2' | 'noverlap' | 'circular' | 'circlepack' | 'random'

/** `defineSigmaPrimitives()` 的产物，组件会在创建实例前解析它 */
export interface SigmaLazyPrimitives {
  __sigmaLazyPrimitives: () => PrimitivesDeclaration | Promise<PrimitivesDeclaration>
}

/** 渲染原语，或一个延迟加载它的声明 */
export type SigmaPrimitivesSource = PrimitivesDeclaration | SigmaLazyPrimitives

/**
 * styles 声明，自定义状态键放宽为任意字符串。
 *
 * 上游把 `NS` / `ES` / `GS` 默认成 `{}`，`matchState` 只认内置状态；组件不是泛型的，
 * 用了 `customNodeState` 的规则否则写不出来
 */
export type SigmaStyles = StylesDeclaration<
  Record<string, unknown>,
  Record<string, unknown>,
  Record<string, unknown>,
  Record<string, unknown>,
  Record<string, unknown>
>

/** 与 `DEFAULT_STYLES` 的合成方式，`'none'` 表示只用用户给的规则 */
export type SigmaStylesBase = 'default' | 'depthless' | 'none'

/**
 * 库内 styles 规则读取的运行时选项。
 *
 * v4 的 styles 只在构造时读取，没有 `setStyles()`。规则形状因此固定在构造期，
 * 可变的部分放进这些 ref，由规则的闭包在每次求值时读。
 */
export interface SigmaStyleOptions {
  /** 高亮时无关元素的淡出色，`null` 表示不淡出 */
  dimColor: Ref<string | null>
  /** 允许显示标签的最低档位，节点档位高于它则隐藏标签 */
  labelTier: Ref<number>
  /** 读取节点档位的属性名 */
  labelTierAttribute: Ref<string>
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
  /** 库内规则的运行时选项，写入后需调用 `refresh()` */
  styleOptions: SigmaStyleOptions
  /**
   * 重新求值 styles 并重绘。
   * 纯视觉变更传 `skipIndexation`，改动可见性或标签时不要传
   */
  refresh: (options?: { skipIndexation?: boolean }) => void
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
  // 浏览器回收了 WebGL 上下文，画布此刻是空的
  webglContextLost: true,
  // 上下文已恢复，sigma 重建了渲染资源并自动重绘
  webglContextRestored: true,
  resize: true,
  kill: true,
  moveBody: true,
  nodeDragStart: true,
  nodeDrag: true,
  nodeDragEnd: true
}

/** sigma 的全部事件名，供批量绑定 */
export const SIGMA_EVENTS = Object.keys(SIGMA_EVENT_FLAGS) as SigmaEventType[]

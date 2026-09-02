<script setup lang="ts" generic="NS = object, ES = object, GS = object">
import Graph from 'graphology'
import { useResizeObserver } from '@vueuse/core'
import { defu } from 'defu'
import { useRuntimeConfig } from '#app'
import { computed, onBeforeUnmount, onMounted, provide, readonly, shallowRef, toRaw, watch } from 'vue'
import type { ShallowRef } from 'vue'
import type Sigma from 'sigma'
import type { Attributes, SerializedGraph } from 'graphology-types'
import type { Settings } from 'sigma/settings'
import type {
  BaseEdgeState,
  BaseGraphState,
  BaseNodeState,
  EdgeReducer,
  ForbidBaseKeys,
  NodeReducer,
  SigmaEdgeEventPayload,
  SigmaEdgeLabelEventPayload,
  SigmaEventType,
  SigmaNodeDragEventPayload,
  SigmaNodeDragMovePayload,
  SigmaNodeEventPayload,
  SigmaNodeLabelEventPayload,
  SigmaStageEventPayload
} from 'sigma/types'
import { registerSigma } from '../composables/use-sigma'
import { SIGMA_CONTEXT_KEY, SIGMA_EVENTS } from '../types'
import type { SigmaContext, SigmaPrimitivesSource, SigmaStyleOptions, SigmaStyles, SigmaStylesBase } from '../types'
import { applyGraphDiff } from '../utils/apply-graph-diff'
import type { ApplyGraphDiffOptions } from '../utils/apply-graph-diff'
import { composeStyles } from '../utils/compose-styles'
import { isLazySigmaPrimitives } from '../utils/define-sigma-primitives'
import { applyNodeLabelAtlas, watchNodeLabelAtlasOverflow } from '../utils/node-label-atlas'
import type { SigmaLabelAtlasOptions } from '../utils/node-label-atlas'

defineOptions({ name: 'SigmaGraph', inheritAttrs: false })

const props = defineProps<{
  /**
   * 图数据，经 `applyGraphDiff` 增量同步。
   * 传了 `graph` 时本项失效，两者互斥
   */
  data?: SerializedGraph
  /**
   * 外部 graphology 实例。传入后本组件完全不碰数据，只负责渲染与生命周期，
   * 可自由使用 graphology 生态的任何方式操作图。省略则内部创建一个并经 `update:graph` 回传
   */
  graph?: Graph
  /**
   * 声明式视觉规则，排在基础规则之后因而覆盖它们。
   * sigma 只在构造时读取，变更会重建实例
   * @see https://v4.sigmajs.org/get-started/style-the-graph/
   */
  styles?: SigmaStyles<NoInfer<NS>, NoInfer<ES>, NoInfer<GS>>
  /**
   * 与哪一套基础规则合成。sigma 拿到 `styles.nodes` 时是整体替换而非合并，
   * 不合成就会丢掉标签绑定、`isHidden` 可见性与悬浮反馈
   * @defaultValue 'default'
   */
  stylesBase?: SigmaStylesBase
  /**
   * 渲染原语：节点形状、边路径、端点、深度层。同样只在构造时读取。
   * 取用 sigma 内置的形状与层工厂时须包在 `defineSigmaPrimitives()` 里延迟加载
   * @see https://v4.sigmajs.org/how-to/primitives/
   */
  primitives?: SigmaPrimitivesSource
  /**
   * sigma 行为与性能配置，整体透传，可热更新
   * @see https://v4.sigmajs.org/how-to/settings/
   */
  settings?: Partial<Settings>
  /**
   * 逐帧计算显示数据的逃生舱，styles 表达不了时才用。
   * 常规视觉映射一律写 `styles`
   */
  nodeReducer?: NodeReducer
  /** 边侧的同名逃生舱 */
  edgeReducer?: EdgeReducer
  /** 自定义节点状态标志位的默认值，键名不能与 `BaseNodeState` 冲突 */
  customNodeState?: ForbidBaseKeys<BaseNodeState, NS>
  /** 自定义边状态标志位的默认值 */
  customEdgeState?: ForbidBaseKeys<BaseEdgeState, ES>
  /** 自定义图级状态标志位的默认值 */
  customGraphState?: ForbidBaseKeys<BaseGraphState, GS>
  /**
   * 节点标签 SDF 字形图集的参数，调的是烘进纹理的源字形，不是标签显示字号（后者在 `styles` 的 `labelSize`）。
   *
   * 上游按 `64 × devicePixelRatio` 生成字形，2 倍屏上 2048² 的图集一页只装得下约 190 个，
   * 中文字形集溢出后节点标签会整体消失，故 `fontSize` 压回 64；字形集更大时再调 `maxTextureSize`。
   * 与 `primitives` 一样只在构造时读取，挂载后改不生效
   * @see https://github.com/jacomyal/sigma.js/issues/1552
   */
  labelAtlas?: SigmaLabelAtlasOptions
  /** 实例 id，登记后可经 `useSigmaById(id)` 在组件树之外访问 */
  id?: string
  /** `applyGraphDiff` 的行为选项 */
  diffOptions?: ApplyGraphDiffOptions
}>()

/**
 * sigma 事件全集，payload 类型与上游一致。
 *
 * 必须逐条写出而非用映射类型派生：`@vue/compiler-sfc` 要在编译期静态提取事件名，
 * 解析不了跨包的映射类型（`vue-tsc` 能过但打包会失败）。
 */
const emit = defineEmits<{
  /** 单击节点 */
  'clickNode': [payload: SigmaNodeEventPayload]
  /** 双击节点，默认会触发相机缩放，可在 payload 上 `preventSigmaDefault()` 阻止 */
  'doubleClickNode': [payload: SigmaNodeEventPayload]
  /** 右键点击节点 */
  'rightClickNode': [payload: SigmaNodeEventPayload]
  /** 在节点上滚动滚轮 */
  'wheelNode': [payload: SigmaNodeEventPayload]
  /** 在节点上按下指针 */
  'downNode': [payload: SigmaNodeEventPayload]
  /** 在节点上松开指针 */
  'upNode': [payload: SigmaNodeEventPayload]
  /** 指针进入节点 */
  'enterNode': [payload: SigmaNodeEventPayload]
  /** 指针离开节点 */
  'leaveNode': [payload: SigmaNodeEventPayload]
  /** 单击边，需先开启 `enableEdgeEvents` */
  'clickEdge': [payload: SigmaEdgeEventPayload]
  /** 双击边 */
  'doubleClickEdge': [payload: SigmaEdgeEventPayload]
  /** 右键点击边 */
  'rightClickEdge': [payload: SigmaEdgeEventPayload]
  /** 在边上滚动滚轮 */
  'wheelEdge': [payload: SigmaEdgeEventPayload]
  /** 在边上按下指针 */
  'downEdge': [payload: SigmaEdgeEventPayload]
  /** 在边上松开指针 */
  'upEdge': [payload: SigmaEdgeEventPayload]
  /** 指针进入边 */
  'enterEdge': [payload: SigmaEdgeEventPayload]
  /** 指针离开边 */
  'leaveEdge': [payload: SigmaEdgeEventPayload]
  /** 单击节点标签，需先配置 `nodeLabelEvents` */
  'clickNodeLabel': [payload: SigmaNodeLabelEventPayload]
  /** 双击节点标签 */
  'doubleClickNodeLabel': [payload: SigmaNodeLabelEventPayload]
  /** 右键点击节点标签 */
  'rightClickNodeLabel': [payload: SigmaNodeLabelEventPayload]
  /** 在节点标签上滚动滚轮 */
  'wheelNodeLabel': [payload: SigmaNodeLabelEventPayload]
  /** 在节点标签上按下指针 */
  'downNodeLabel': [payload: SigmaNodeLabelEventPayload]
  /** 在节点标签上松开指针 */
  'upNodeLabel': [payload: SigmaNodeLabelEventPayload]
  /** 指针进入节点标签 */
  'enterNodeLabel': [payload: SigmaNodeLabelEventPayload]
  /** 指针离开节点标签 */
  'leaveNodeLabel': [payload: SigmaNodeLabelEventPayload]
  /** 单击边标签，需先配置 `edgeLabelEvents` */
  'clickEdgeLabel': [payload: SigmaEdgeLabelEventPayload]
  /** 双击边标签 */
  'doubleClickEdgeLabel': [payload: SigmaEdgeLabelEventPayload]
  /** 右键点击边标签 */
  'rightClickEdgeLabel': [payload: SigmaEdgeLabelEventPayload]
  /** 在边标签上滚动滚轮 */
  'wheelEdgeLabel': [payload: SigmaEdgeLabelEventPayload]
  /** 在边标签上按下指针 */
  'downEdgeLabel': [payload: SigmaEdgeLabelEventPayload]
  /** 在边标签上松开指针 */
  'upEdgeLabel': [payload: SigmaEdgeLabelEventPayload]
  /** 指针进入边标签 */
  'enterEdgeLabel': [payload: SigmaEdgeLabelEventPayload]
  /** 指针离开边标签 */
  'leaveEdgeLabel': [payload: SigmaEdgeLabelEventPayload]
  /** 单击空白画布 */
  'clickStage': [payload: SigmaStageEventPayload]
  /** 双击空白画布，默认会触发相机缩放 */
  'doubleClickStage': [payload: SigmaStageEventPayload]
  /** 右键点击空白画布 */
  'rightClickStage': [payload: SigmaStageEventPayload]
  /** 在空白画布上滚动滚轮，默认会触发相机缩放 */
  'wheelStage': [payload: SigmaStageEventPayload]
  /** 在空白画布上按下指针 */
  'downStage': [payload: SigmaStageEventPayload]
  /** 在空白画布上松开指针 */
  'upStage': [payload: SigmaStageEventPayload]
  /** 指针进入画布区域 */
  'enterStage': [payload: SigmaStageEventPayload]
  /** 指针离开画布区域 */
  'leaveStage': [payload: SigmaStageEventPayload]
  /** 指针在画布上移动，坐标随动，用于自绘跟随层 */
  'moveBody': [payload: SigmaStageEventPayload]
  /** 开始拖拽节点，需先开启 `enableNodeDrag` */
  'nodeDragStart': [payload: SigmaNodeDragEventPayload]
  /** 拖拽节点过程中 */
  'nodeDrag': [payload: SigmaNodeDragMovePayload]
  /** 结束拖拽节点 */
  'nodeDragEnd': [payload: SigmaNodeDragEventPayload]
  /** 每帧清空画布前 */
  'beforeClear': []
  /** 每帧清空画布后 */
  'afterClear': []
  /** 图数据进入渲染管线处理前 */
  'beforeProcess': []
  /** 图数据处理完成、即将绘制前 */
  'afterProcess': []
  /** 每帧绘制前 */
  'beforeRender': []
  /** 每帧绘制后 */
  'afterRender': []
  /** 每帧纹理上传完成后 */
  'afterTexturesUpload': []
  /** 浏览器回收了 WebGL 上下文，画布此刻是空的 */
  'webglContextLost': []
  /** 上下文已恢复，sigma 重建了渲染资源并自动重绘 */
  'webglContextRestored': []
  /** 容器尺寸变化、画布已重新适配 */
  'resize': []
  /** 实例被销毁 */
  'kill': []
  /** 实例创建完成，payload 是原生 `Sigma` 对象 */
  'ready': [sigma: Sigma]
  /** 内部创建的 graphology 实例回传，仅在未传 `graph` 时触发 */
  'update:graph': [graph: Graph]
}>()

const containerRef = shallowRef<HTMLElement | null>(null)
const sigma = shallowRef<Sigma | null>(null)
const isReady = shallowRef(false)

/**
 * 内部图按 `data.options` 建，否则 `multi: true` 的数据会被降级：
 * 无 key 的平行边在非多重图上会命中同一条边，三条 a→b 合并成一条。
 */
function createInternalGraph(): Graph {
  return new Graph(props.data?.options)
}

// toRaw 剥掉 Vue 给 props 套的响应式代理，下发出去的才是原生实例
const graph = shallowRef<Graph>(props.graph ? toRaw(props.graph) : createInternalGraph())
const isExternalGraph = computed(() => props.graph !== undefined)

let resolveReady: ((instance: Sigma) => void) | undefined
let readyPromise = new Promise<Sigma>((resolve) => {
  resolveReady = resolve
})

const moduleDefaults = (useRuntimeConfig().public.sigma as { settings?: Partial<Settings> } | undefined)?.settings ?? {}

const resolvedSettings = computed<Partial<Settings>>(() => defu(
  props.settings ?? {},
  moduleDefaults,
  // 容器尺寸为 0 时不让 sigma 直接抛错，随后由 ResizeObserver 补一次 resize
  { allowInvalidContainer: true }
) as Partial<Settings>)

const styleOptions: SigmaStyleOptions = {
  dimColor: shallowRef<string | null>(null),
  labelTier: shallowRef(Number.POSITIVE_INFINITY),
  labelTierAttribute: shallowRef('labelTier')
}

function isBeyondLabelTier(attributes: Attributes): boolean {
  const tier = attributes[styleOptions.labelTierAttribute.value]
  return typeof tier === 'number' && tier > styleOptions.labelTier.value
}

function isDimmed(state: { isHighlighted: boolean }, graphState: BaseGraphState): boolean {
  return styleOptions.dimColor.value !== null && graphState.hasHighlighted && !state.isHighlighted
}

const dimmed = {
  color: () => styleOptions.dimColor.value ?? '#d1d5db',
  labelVisibility: 'hidden',
  zIndex: 0
} as const

/**
 * 库内规则。v4 没有 `setStyles()`，规则形状只能固定在构造期，可变部分由闭包
 * 从 `styleOptions` 读。排在用户规则之后，composables 的分级与淡出才盖得住用户的视觉映射
 */
const libraryStyles: SigmaStyles = {
  nodes: [
    { when: attributes => isBeyondLabelTier(attributes), then: { labelVisibility: 'hidden' } },
    { when: (_attributes, state, graphState) => isDimmed(state, graphState), then: { ...dimmed } }
  ],
  edges: [
    { when: (_attributes, state, graphState) => isDimmed(state, graphState), then: { ...dimmed } }
  ]
}

/*
 * 刷新前先取一次图级状态：`setNodeState` 系列只把标志位标脏，`hasHighlighted` 等要
 * 等下一次 flush 才重算，而 `refresh()` 内部把未 flush 的 graphState 直接喂给求值。
 * 状态刚写完就刷新时（悬浮解除是典型场景），规则会拿旧标志算出淡出态，`processNodes`
 * 再把它烘进 labelGrid，之后的状态刷新只改样式不重建栅格，标签就再也回不来。
 */
function refresh(options?: { skipIndexation?: boolean }) {
  sigma.value?.getGraphState()
  sigma.value?.refresh(options)
}

const context: SigmaContext = {
  sigma,
  graph,
  isReady: readonly(isReady),
  whenReady: () => (sigma.value ? Promise.resolve(sigma.value) : readyPromise),
  styleOptions,
  refresh
}

provide(SIGMA_CONTEXT_KEY, context)

// 纯颜色变更不影响标签栅格与拾取，可以跳过重建索引
watch(styleOptions.dimColor, () => refresh({ skipIndexation: true }))
watch([styleOptions.labelTier, styleOptions.labelTierAttribute], () => refresh())

function syncData() {
  if (!props.data || isExternalGraph.value) {
    return
  }
  applyGraphDiff(graph.value, props.data, props.diffOptions)
}

watch(() => props.data, syncData, { immediate: true })

watch(() => props.graph, (next) => {
  const raw = next ? toRaw(next) : null
  if (!raw || raw === graph.value) {
    return
  }
  graph.value = raw
  sigma.value?.setGraph(raw)
})

watch(resolvedSettings, (next) => {
  sigma.value?.setSettings(next)
}, { deep: true })

useResizeObserver(containerRef, () => {
  sigma.value?.resize()
})

let disposed = false
let stopAtlasWatch: (() => void) | undefined

function destroyInstance() {
  stopAtlasWatch?.()
  stopAtlasWatch = undefined
  sigma.value?.kill()
  sigma.value = null
  isReady.value = false
  readyPromise = new Promise<Sigma>((resolve) => {
    resolveReady = resolve
  })
}

/**
 * sigma 拿到 `styles.nodes` 时整体替换 `DEFAULT_STYLES.nodes` 而非合并，
 * 不显式合成就会丢掉标签绑定、`isHidden` 可见性与悬浮反馈
 */
async function resolveStyles(): Promise<SigmaStyles> {
  // 组件的泛型到这里为止：composeStyles 只按序拼接规则数组，不看状态形状
  const userStyles = toRaw(props.styles) as SigmaStyles | undefined
  const base = props.stylesBase ?? 'default'
  if (base === 'none') {
    return composeStyles(userStyles, libraryStyles)
  }

  const { DEFAULT_STYLES, DEPTHLESS_STYLES } = await import('sigma/types')
  const preset = base === 'depthless' ? DEPTHLESS_STYLES : DEFAULT_STYLES

  return composeStyles(preset as SigmaStyles, userStyles, libraryStyles)
}

async function createInstance() {
  // sigma 在模块顶层就读 WebGL2RenderingContext，静态导入会让 SSR 直接 ReferenceError
  const { default: Sigma } = await import('sigma')

  const container = containerRef.value
  if (disposed || !container) {
    return
  }

  // 延迟声明的原语在建实例前解析完，避免节点带着尚未注册的形状先渲染
  const source = props.primitives
  const primitives = source && isLazySigmaPrimitives(source)
    ? await source.__sigmaLazyPrimitives()
    : toRaw(source)

  if (disposed) {
    return
  }

  const instance = new Sigma(graph.value, container, {
    primitives,
    styles: await resolveStyles(),
    settings: resolvedSettings.value,
    nodeReducer: props.nodeReducer,
    edgeReducer: props.edgeReducer,
    customNodeState: toRaw(props.customNodeState),
    customEdgeState: toRaw(props.customEdgeState),
    customGraphState: toRaw(props.customGraphState)
  })

  // 必须赶在首帧之前：此刻图集里还没有任何字形，换掉整个 manager 不丢数据
  applyNodeLabelAtlas(instance, toRaw(props.labelAtlas), primitives?.nodes?.label?.font)

  // 挂在换过图集之后，否则监听的是那个已经被丢弃的 manager
  if (import.meta.dev) {
    stopAtlasWatch = watchNodeLabelAtlasOverflow(instance)
  }

  for (const event of SIGMA_EVENTS) {
    instance.on(event as SigmaEventType, (payload: unknown) => {
      emit(event as never, payload as never)
    })
  }

  sigma.value = instance
  isReady.value = true
  resolveReady?.(instance)

  emit('ready', instance)
}

/**
 * styles、primitives 与 reducer 都是构造时读取的，改了只能重建。
 *
 * 比引用而非比值：deep 比较会让模板里内联的对象字面量在父组件每次重渲染时
 * 都判定为「变了」，于是反复重建实例。使用方应把它们提到 setup 顶层或包进
 * computed 保持引用稳定
 */
watch([() => props.styles, () => props.primitives, () => props.stylesBase, () => props.nodeReducer, () => props.edgeReducer], async () => {
  if (!sigma.value) {
    return
  }

  if (import.meta.dev) {
    console.warn('[@movk/sigma] styles、primitives 或 reducer 变更，正在重建 sigma 实例。若非有意为之，请把它们提到 setup 顶层保持引用稳定')
  }

  destroyInstance()
  await createInstance()
})

onMounted(async () => {
  if (import.meta.dev && props.data && isExternalGraph.value) {
    console.warn('[@movk/sigma] data 与 graph 互斥，已传入外部 graph，data 将被忽略')
  }

  await createInstance()

  if (!isExternalGraph.value && sigma.value) {
    emit('update:graph', graph.value)
  }
})

// 只在客户端登记：注册表是模块级单例，而服务端不触发 onBeforeUnmount，条目只增不减
if (props.id && import.meta.client) {
  const unregister = registerSigma(props.id, context)
  onBeforeUnmount(unregister)
}

onBeforeUnmount(() => {
  disposed = true
  destroyInstance()
})

defineExpose({
  sigma: sigma as ShallowRef<Sigma<Attributes, Attributes, Attributes, NS, ES, GS> | null>,
  graph
})
</script>

<template>
  <div
    class="sigma-root"
    v-bind="$attrs"
  >
    <div
      ref="containerRef"
      class="sigma-canvas"
    />
    <slot
      v-if="isReady"
      :sigma="sigma!"
      :graph="graph"
    />
  </div>
</template>

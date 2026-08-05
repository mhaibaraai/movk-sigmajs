<script setup lang="ts">
import Graph from 'graphology'
import { useResizeObserver } from '@vueuse/core'
import { defu } from 'defu'
import { useRuntimeConfig } from '#app'
import { computed, onBeforeUnmount, onMounted, provide, readonly, shallowRef, toRaw, watch } from 'vue'
import type Sigma from 'sigma'
import type { SerializedGraph } from 'graphology-types'
import type { Settings } from 'sigma/settings'
import type {
  BaseEdgeState,
  BaseNodeState,
  EdgeDisplayData,
  EdgeReducer,
  NodeDisplayData,
  NodeReducer,
  SigmaEdgeEventPayload,
  SigmaEdgeLabelEventPayload,
  SigmaEventType,
  SigmaNodeDragEventPayload,
  SigmaNodeDragMovePayload,
  SigmaNodeEventPayload,
  SigmaNodeLabelEventPayload,
  SigmaStageEventPayload,
  StylesDeclaration
} from 'sigma/types'
import { registerSigma } from '../composables/use-sigma'
import { SIGMA_CONTEXT_KEY, SIGMA_EVENTS } from '../types'
import type { SigmaContext, SigmaPrimitivesSource, SigmaReducer, SigmaReducerEntry } from '../types'
import { applyGraphDiff } from '../utils/apply-graph-diff'
import type { ApplyGraphDiffOptions } from '../utils/apply-graph-diff'
import { chainReducers } from '../utils/chain-reducers'
import { isLazySigmaPrimitives } from '../utils/define-sigma-primitives'

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
   * 声明式视觉规则，整体透传。sigma 只在构造时读取，变更会重建实例
   * @see https://v4.sigmajs.org/how-to/styles/
   */
  styles?: StylesDeclaration
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
  /** 自带的节点归约，作为 reducer 链的基座执行 */
  nodeReducer?: NodeReducer
  /** 自带的边归约，作为 reducer 链的基座执行 */
  edgeReducer?: EdgeReducer
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

const reducerEntries: SigmaReducerEntry[] = []

let composedNode: SigmaReducer<NodeDisplayData, BaseNodeState> | null = null
let composedEdge: SigmaReducer<EdgeDisplayData, BaseEdgeState> | null = null

/**
 * v4 的 reducer 只能在构造时给定，因此交出去的是这对稳定闭包，
 * 链的增删只重算 composed，不必重建实例
 */
function composeReducers() {
  const sorted = [...reducerEntries].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  composedNode = chainReducers<NodeDisplayData, BaseNodeState>([
    props.nodeReducer as SigmaReducer<NodeDisplayData, BaseNodeState> | undefined,
    ...sorted.map(entry => entry.node)
  ])
  composedEdge = chainReducers<EdgeDisplayData, BaseEdgeState>([
    props.edgeReducer as SigmaReducer<EdgeDisplayData, BaseEdgeState> | undefined,
    ...sorted.map(entry => entry.edge)
  ])
}

const dispatchNodeReducer: NodeReducer = (key, data, attributes, state, graphState, instanceGraph) =>
  composedNode?.(key, data, attributes, state, graphState, instanceGraph) ?? data

const dispatchEdgeReducer: EdgeReducer = (key, data, attributes, state, graphState, instanceGraph) =>
  composedEdge?.(key, data, attributes, state, graphState, instanceGraph) ?? data

function refreshReducers() {
  composeReducers()
  sigma.value?.refresh()
}

function registerReducer(entry: SigmaReducerEntry): () => void {
  reducerEntries.push(entry)
  refreshReducers()

  return () => {
    const index = reducerEntries.indexOf(entry)
    if (index !== -1) {
      reducerEntries.splice(index, 1)
      refreshReducers()
    }
  }
}

const context: SigmaContext = {
  sigma,
  graph,
  isReady: readonly(isReady),
  whenReady: () => (sigma.value ? Promise.resolve(sigma.value) : readyPromise),
  registerReducer,
  refreshReducers
}

provide(SIGMA_CONTEXT_KEY, context)

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

watch([() => props.nodeReducer, () => props.edgeReducer], refreshReducers)

useResizeObserver(containerRef, () => {
  sigma.value?.resize()
})

let disposed = false

function destroyInstance() {
  sigma.value?.kill()
  sigma.value = null
  isReady.value = false
  readyPromise = new Promise<Sigma>((resolve) => {
    resolveReady = resolve
  })
}

async function createInstance() {
  // sigma 在模块顶层就读 WebGL2RenderingContext，静态导入会让 SSR 直接 ReferenceError
  const { default: Sigma } = await import('sigma')

  const container = containerRef.value
  if (disposed || !container) {
    return
  }

  composeReducers()

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
    styles: toRaw(props.styles),
    settings: resolvedSettings.value,
    nodeReducer: dispatchNodeReducer,
    edgeReducer: dispatchEdgeReducer
  })

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
 * styles 与 primitives 是构造时读取的，改了只能重建。
 *
 * 比引用而非比值：deep 比较会让模板里内联的对象字面量在父组件每次重渲染时
 * 都判定为「变了」，于是反复重建实例。使用方应把它们提到 setup 顶层或包进
 * computed 保持引用稳定
 */
watch([() => props.styles, () => props.primitives], async () => {
  if (!sigma.value) {
    return
  }

  if (import.meta.dev) {
    console.warn('[@movk/sigma] styles 或 primitives 变更，正在重建 sigma 实例。若非有意为之，请把它们提到 setup 顶层保持引用稳定')
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

defineExpose({ sigma, graph })
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

<script setup lang="ts">
import Graph from 'graphology'
import { useResizeObserver } from '@vueuse/core'
import { defu } from 'defu'
import { computed, onBeforeUnmount, onMounted, provide, readonly, shallowRef, toRaw, watch } from 'vue'
import type Sigma from 'sigma'
import type { SerializedGraph } from 'graphology-types'
import type { Settings } from 'sigma/settings'
import type { EdgeProgramType, NodeProgramType } from 'sigma/rendering'
import type { EdgeDisplayData, NodeDisplayData, SigmaEdgeEventPayload, SigmaEventType, SigmaNodeEventPayload, SigmaStageEventPayload } from 'sigma/types'
import { registerSigma } from '../composables/use-sigma'
import { SIGMA_CONTEXT_KEY, SIGMA_EVENTS } from '../types'
import type { SigmaContext, SigmaProgramSource, SigmaPrograms, SigmaReducer, SigmaReducerEntry } from '../types'
import { isLazySigmaProgram } from '../utils/define-sigma-program'
import { applyGraphDiff } from '../utils/apply-graph-diff'
import type { ApplyGraphDiffOptions } from '../utils/apply-graph-diff'
import { chainReducers } from '../utils/chain-reducers'
import { getSigmaDefaults } from '../utils/global-settings'

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
   * sigma 渲染配置，整体透传
   * @see https://www.sigmajs.org/docs/typedoc/sigma/src/settings/interfaces/Settings
   */
  settings?: Partial<Settings>
  /** 自定义渲染程序，与 sigma 内置程序合并 */
  programs?: SigmaPrograms
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

/** sigma 的内置渲染程序表，只能在客户端拿到 */
let programDefaults: {
  node: Record<string, NodeProgramType>
  edge: Record<string, EdgeProgramType>
} | null = null

/** 解析完成的自定义程序，`defineSigmaProgram()` 声明的已在此兑现 */
const resolvedPrograms = shallowRef<{
  node?: Record<string, NodeProgramType>
  edge?: Record<string, EdgeProgramType>
}>({})

async function resolveProgramSources<T>(
  sources?: Record<string, SigmaProgramSource<T>>
): Promise<Record<string, T> | undefined> {
  if (!sources) {
    return undefined
  }

  const entries = await Promise.all(
    Object.entries(sources).map(async ([type, source]) => [
      type,
      isLazySigmaProgram<T>(source) ? await source.__sigmaLazyProgram() : source
    ] as const)
  )

  return Object.fromEntries(entries)
}

const baseSettings = computed<Partial<Settings>>(() => defu(
  props.settings ?? {},
  getSigmaDefaults(),
  // 容器尺寸为 0 时不让 sigma 直接抛错，随后由 ResizeObserver 补一次 resize
  { allowInvalidContainer: true }
) as Partial<Settings>)

/** reducer 链，按 order 升序合成为单个函数交给 sigma */
const reducerEntries: SigmaReducerEntry[] = []

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

function refreshReducers() {
  const instance = sigma.value
  if (!instance) {
    return
  }
  instance.setSettings(resolveSettings())
  instance.refresh()
}

function resolveSettings(): Partial<Settings> {
  const base = baseSettings.value
  const { node, edge } = resolvedPrograms.value
  const sorted = [...reducerEntries].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  return {
    ...base,
    // 用户自带的 reducer 排在链首作为基座，库注册的在其后叠加
    nodeReducer: chainReducers<NodeDisplayData>([
      base.nodeReducer as SigmaReducer<NodeDisplayData> | null | undefined,
      ...sorted.map(entry => entry.node)
    ]) as Settings['nodeReducer'],
    edgeReducer: chainReducers<EdgeDisplayData>([
      base.edgeReducer as SigmaReducer<EdgeDisplayData> | null | undefined,
      ...sorted.map(entry => entry.edge)
    ]) as Settings['edgeReducer'],
    ...(programDefaults && node && {
      nodeProgramClasses: { ...programDefaults.node, ...base.nodeProgramClasses, ...node }
    }),
    ...(programDefaults && edge && {
      edgeProgramClasses: { ...programDefaults.edge, ...base.edgeProgramClasses, ...edge }
    })
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

watch([baseSettings, resolvedPrograms], () => {
  sigma.value?.setSettings(resolveSettings())
}, { deep: true })

watch(() => props.programs, async (sources) => {
  if (!sigma.value) {
    return
  }
  resolvedPrograms.value = {
    node: await resolveProgramSources(sources?.node),
    edge: await resolveProgramSources(sources?.edge)
  }
})

useResizeObserver(containerRef, () => {
  sigma.value?.resize()
})

let disposed = false

onMounted(async () => {
  if (import.meta.dev && props.data && isExternalGraph.value) {
    console.warn('[@movk/sigma] data 与 graph 互斥，已传入外部 graph，data 将被忽略')
  }

  // sigma 在模块顶层就读 WebGL2RenderingContext，静态导入会让 SSR 直接 ReferenceError
  const [{ default: Sigma }, { DEFAULT_NODE_PROGRAM_CLASSES, DEFAULT_EDGE_PROGRAM_CLASSES }, node, edge] = await Promise.all([
    import('sigma'),
    import('sigma/settings'),
    // 自定义程序在建实例前解析完，避免节点带着尚未注册的 type 先渲染
    resolveProgramSources(props.programs?.node),
    resolveProgramSources(props.programs?.edge)
  ])

  const container = containerRef.value
  if (disposed || !container) {
    return
  }

  programDefaults = { node: DEFAULT_NODE_PROGRAM_CLASSES, edge: DEFAULT_EDGE_PROGRAM_CLASSES }
  resolvedPrograms.value = { node, edge }

  const instance = new Sigma(graph.value, container, resolveSettings())

  for (const event of SIGMA_EVENTS) {
    instance.on(event as SigmaEventType, (payload: unknown) => {
      emit(event as never, payload as never)
    })
  }

  sigma.value = instance
  isReady.value = true
  resolveReady?.(instance)

  if (!isExternalGraph.value) {
    emit('update:graph', graph.value)
  }

  emit('ready', instance)
})

// 只在客户端登记：注册表是模块级单例，而服务端不触发 onBeforeUnmount，条目只增不减
if (props.id && import.meta.client) {
  const unregister = registerSigma(props.id, context)
  onBeforeUnmount(unregister)
}

onBeforeUnmount(() => {
  disposed = true
  sigma.value?.kill()
  sigma.value = null
  isReady.value = false
  readyPromise = new Promise<Sigma>((resolve) => {
    resolveReady = resolve
  })
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

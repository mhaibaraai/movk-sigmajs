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
   * sigma 渲染配置，整体透传，不逐字段枚举也不过滤未知键
   * @see https://www.sigmajs.org/docs/typedoc/sigma/src/settings/interfaces/Settings
   */
  settings?: Partial<Settings>
  /**
   * 自定义渲染程序，与 sigma 内置程序合并。
   * 接受任何符合官方程序类型的实现，不限于 `@sigma/*` 官方包
   */
  programs?: SigmaPrograms
  /** 实例 id，登记后可经 `useSigmaById(id)` 在组件树之外访问 */
  id?: string
  /** `applyGraphDiff` 的行为选项 */
  diffOptions?: ApplyGraphDiffOptions
}>()

/**
 * sigma 事件全集，payload 类型与上游一致。
 *
 * 这里必须逐条写出而非用映射类型派生：`@vue/compiler-sfc` 需要在编译期静态提取事件名，
 * 它解析不了跨包的映射类型（`vue-tsc` 能过但打包会失败）。
 * 上游新增事件时，`runtime/types` 里的 `Record<SigmaEventType, true>` 会先报错提示同步这里。
 */
const emit = defineEmits<{
  'clickNode': [payload: SigmaNodeEventPayload]
  'doubleClickNode': [payload: SigmaNodeEventPayload]
  'rightClickNode': [payload: SigmaNodeEventPayload]
  'wheelNode': [payload: SigmaNodeEventPayload]
  'downNode': [payload: SigmaNodeEventPayload]
  'upNode': [payload: SigmaNodeEventPayload]
  'enterNode': [payload: SigmaNodeEventPayload]
  'leaveNode': [payload: SigmaNodeEventPayload]
  'clickEdge': [payload: SigmaEdgeEventPayload]
  'doubleClickEdge': [payload: SigmaEdgeEventPayload]
  'rightClickEdge': [payload: SigmaEdgeEventPayload]
  'wheelEdge': [payload: SigmaEdgeEventPayload]
  'downEdge': [payload: SigmaEdgeEventPayload]
  'upEdge': [payload: SigmaEdgeEventPayload]
  'enterEdge': [payload: SigmaEdgeEventPayload]
  'leaveEdge': [payload: SigmaEdgeEventPayload]
  'clickStage': [payload: SigmaStageEventPayload]
  'doubleClickStage': [payload: SigmaStageEventPayload]
  'rightClickStage': [payload: SigmaStageEventPayload]
  'wheelStage': [payload: SigmaStageEventPayload]
  'downStage': [payload: SigmaStageEventPayload]
  'upStage': [payload: SigmaStageEventPayload]
  'enterStage': [payload: SigmaStageEventPayload]
  'leaveStage': [payload: SigmaStageEventPayload]
  'moveBody': [payload: SigmaStageEventPayload]
  'beforeClear': []
  'afterClear': []
  'beforeProcess': []
  'afterProcess': []
  'beforeRender': []
  'afterRender': []
  'resize': []
  'kill': []
  'ready': [sigma: Sigma]
  'update:graph': [graph: Graph]
}>()

const containerRef = shallowRef<HTMLElement | null>(null)
const sigma = shallowRef<Sigma | null>(null)
const isReady = shallowRef(false)

/**
 * 内部图按 `data.options` 建，否则 `multi: true` 的数据会被降级：
 * 无 key 的平行边在非多重图上会命中同一条边，三条 a→b 合并成一条。
 *
 * props 会被 Vue 包成响应式代理，必须 `toRaw` 剥回原对象再交给 sigma 与 graphology，
 * 否则下发出去的就不是「原生实例」了，instanceof 与内部状态都可能出问题
 */
function createInternalGraph(): Graph {
  return new Graph(props.data?.options)
}

const graph = shallowRef<Graph>(props.graph ? toRaw(props.graph) : createInternalGraph())
const isExternalGraph = computed(() => props.graph !== undefined)

let resolveReady: ((instance: Sigma) => void) | undefined
let readyPromise = new Promise<Sigma>((resolve) => {
  resolveReady = resolve
})

/**
 * sigma 的内置渲染程序表。
 * 只能在客户端拿到——见下方 onMounted 里对动态导入的说明
 */
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

/**
 * reducer 链。sigma 的 nodeReducer / edgeReducer 各只接受一个函数，后设置的会覆盖先设置的，
 * 于是高亮、淡出、过滤、图例显隐这些独立关注点无法共存。
 * 这里维护一条按 order 升序的链，合成为单个函数交给 sigma。
 */
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
    // 用户自带的 reducer 永远排在链首作为基座，库注册的在其后叠加，不得被吞掉
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

  // sigma 在模块顶层就读取 WebGL2RenderingContext 建常量表，静态导入会让 SSR 直接 ReferenceError。
  // 必须推迟到客户端挂载后再加载，graphology 无此问题可以正常静态导入
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

/**
 * 只在客户端登记。注册表是模块级单例，而服务端不会触发 `onBeforeUnmount`，
 * SSR 期注册的条目只增不减，既跨请求残留又会把后续渲染误判成 id 冲突。
 * 何况服务端的 `sigma` 恒为 `null`（实例在 `onMounted` 才创建），登记本身没有意义。
 */
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

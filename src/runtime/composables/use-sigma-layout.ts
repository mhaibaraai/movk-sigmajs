import Graph from 'graphology'
import { onScopeDispose, readonly, shallowRef } from 'vue'
import type { Ref } from 'vue'
import { useSigma } from './use-sigma'
import type { SigmaLayoutName } from '../types'

/** 支持后台持续迭代的布局，其余为一次性计算 */
const SUPERVISED_LAYOUTS = new Set<SigmaLayoutName>(['forceatlas2', 'noverlap'])

const DEFAULT_COMPONENT_GAP = 60

const DEFAULT_COMPONENT_EDGE_LENGTH = 100

/** 节点未给 size 时的占位半径，仅用于算分量外接圆 */
const FALLBACK_NODE_RADIUS = 1

/** graphology 的布局 supervisor，两个 worker 包的形状一致 */
interface LayoutSupervisor {
  start: () => void
  stop: () => void
  kill: () => void
  isRunning: () => boolean
}

export interface SigmaLayoutComponentOptions {
  /**
   * 分量之间的间距，图坐标
   * @defaultValue 60
   */
  gap?: number
  /**
   * 归一化后的目标平均边长，让疏密不同的分量在打包时尺度可比
   * @defaultValue 100
   */
  edgeLength?: number
}

export interface UseSigmaLayoutOptions {
  /**
   * 迭代型布局是否放到 worker 里跑，避免阻塞主线程
   * @defaultValue true
   */
  worker?: boolean
  /**
   * 透传给底层算法的设置，不做键过滤
   * @see https://graphology.github.io/standard-library/layout-forceatlas2.html
   */
  settings?: Record<string, unknown>
  /**
   * 非 worker 模式下 forceatlas2 的迭代次数
   * @defaultValue 100
   */
  iterations?: number
  /**
   * 按弱连通分量分别布局，再把各分量的外接圆打包到一起。
   *
   * ForceAtlas2 在互不相连的分量之间只有斥力没有引力，全图跑一遍会把分量推到四角、
   * 中间大片留白。开启后每个分量单独计算，分量之间的相对位置改由圆形打包决定。
   * 与 `worker` 互斥——worker 版每帧回写全图坐标，打包结果会被立刻覆盖，
   * 因此开启后 `isSupervised` 恒为 `false`、`start()` 退化为 `assign()`。
   *
   * 打包需要可选依赖 `graphology-layout`。
   * @defaultValue false
   */
  byComponent?: boolean | SigmaLayoutComponentOptions
}

export interface UseSigmaLayoutReturn {
  /** 该布局是否支持后台持续迭代 */
  isSupervised: boolean
  /** worker 是否正在运行 */
  isRunning: Readonly<Ref<boolean>>
  /** 计算一次并写回节点坐标 */
  assign: () => Promise<void>
  /** 启动持续迭代，一次性布局上等价于 assign */
  start: () => Promise<void>
  /** 停止迭代 */
  stop: () => void
  /** 终止并释放 worker */
  kill: () => void
}

/** 一个分量的布局结果，坐标仍在分量自己的局部原点上 */
interface ComponentBlock {
  keys: string[]
  sub: Graph
  center: { x: number, y: number }
  radius: number
}

/** 按弱连通分量切分，规模降序、同规模按首个 key，保证同一份数据每次结果一致 */
function connectedComponents(graph: Graph): string[][] {
  const visited = new Set<string>()
  const components: string[][] = []

  graph.forEachNode((node) => {
    if (visited.has(node)) {
      return
    }

    const queue = [node]
    const component: string[] = []
    visited.add(node)

    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const current = queue[cursor]!
      component.push(current)

      for (const neighbor of graph.neighbors(current)) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor)
          queue.push(neighbor)
        }
      }
    }

    components.push(component)
  })

  return components.sort((a, b) => b.length - a.length || a[0]!.localeCompare(b[0]!))
}

/**
 * 复制出各分量的子图，节点与边的属性一并带上——布局要读 `size` 与 `weight`。
 *
 * 边只遍历一次并按分量归位，避免逐个分量重扫全图。
 */
function extractComponents(graph: Graph, components: readonly string[][]): Graph[] {
  const index = new Map<string, number>()
  components.forEach((keys, position) => {
    for (const key of keys) {
      index.set(key, position)
    }
  })

  const subs = components.map((keys) => {
    const sub = new Graph({ type: 'undirected', multi: true, allowSelfLoops: false })
    for (const key of keys) {
      sub.addNode(key, { ...graph.getNodeAttributes(key) })
    }
    return sub
  })

  graph.forEachEdge((_edge, attributes, source, target) => {
    const position = index.get(source)
    if (source === target || position === undefined || position !== index.get(target)) {
      return
    }
    subs[position]!.addEdge(source, target, { ...attributes })
  })

  return subs
}

/**
 * 给缺坐标的节点铺一个圆周起点。
 *
 * ForceAtlas2 只推开已有坐标、不凭空生成，全部重合时斥力没有确定方向。
 * 已有有限坐标的节点保持不动，`noverlap` 这类依赖初始位置的布局才不会被打乱。
 */
function seedMissingPositions(sub: Graph, scale: number): void {
  const total = sub.order
  let index = 0

  sub.forEachNode((node, attributes) => {
    const angle = (index / total) * Math.PI * 2
    index += 1

    if (!Number.isFinite(attributes.x as number) || !Number.isFinite(attributes.y as number)) {
      sub.mergeNodeAttributes(node, { x: Math.cos(angle) * scale, y: Math.sin(angle) * scale })
    }
  })
}

/** 缩放到统一的平均边长，疏密不同的分量打包后尺度才可比 */
function normalizeScale(sub: Graph, edgeLength: number): void {
  if (sub.size === 0) {
    return
  }

  let total = 0
  sub.forEachEdge((_edge, _attributes, _source, _target, sourceAttributes, targetAttributes) => {
    total += Math.hypot(
      (sourceAttributes.x as number) - (targetAttributes.x as number),
      (sourceAttributes.y as number) - (targetAttributes.y as number)
    )
  })

  const mean = total / sub.size
  if (!mean) {
    return
  }

  const factor = edgeLength / mean
  sub.forEachNode((node, attributes) => {
    sub.mergeNodeAttributes(node, {
      x: (attributes.x as number) * factor,
      y: (attributes.y as number) * factor
    })
  })
}

/** 分量的外接圆：圆心取包围盒中心，半径含节点自身的绘制半径 */
function measureComponent(keys: string[], sub: Graph): ComponentBlock {
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  sub.forEachNode((_node, attributes) => {
    const size = Number(attributes.size) || FALLBACK_NODE_RADIUS
    minX = Math.min(minX, (attributes.x as number) - size)
    minY = Math.min(minY, (attributes.y as number) - size)
    maxX = Math.max(maxX, (attributes.x as number) + size)
    maxY = Math.max(maxY, (attributes.y as number) + size)
  })

  const center = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
  const radius = Math.max(Math.hypot(maxX - minX, maxY - minY) / 2, FALLBACK_NODE_RADIUS)

  return { keys, sub, center, radius }
}

/**
 * 布局算法的统一入口，并托管 worker 的生命周期。
 *
 * ForceAtlas2 与 Noverlap 的 worker 会持续占用线程，组件卸载或 HMR 时不 kill 就泄漏，
 * 这里统一在作用域销毁时释放。
 *
 * 全部布局包都是可选 peer，用到时才动态导入。
 */
export function useSigmaLayout(
  name: SigmaLayoutName,
  options: UseSigmaLayoutOptions = {}
): UseSigmaLayoutReturn {
  const { worker = true, settings, iterations = 100, byComponent = false } = options
  const { graph, sigma } = useSigma()

  const component = byComponent
    ? {
        gap: DEFAULT_COMPONENT_GAP,
        edgeLength: DEFAULT_COMPONENT_EDGE_LENGTH,
        ...(byComponent === true ? {} : byComponent)
      }
    : null

  // 分量打包与 worker 互斥：worker 每帧回写全图坐标，打包结果留不住
  const isSupervised = SUPERVISED_LAYOUTS.has(name) && !component
  const isRunning = shallowRef(false)

  let supervisor: LayoutSupervisor | null = null

  function missing(pkg: string): never {
    throw new Error(`[@movk/sigma] 布局 ${name} 需要可选依赖 ${pkg}，请先安装：pnpm add ${pkg}`)
  }

  async function loadOneShot(target: Graph) {
    if (name === 'forceatlas2') {
      const module = await import('graphology-layout-forceatlas2').catch(() => missing('graphology-layout-forceatlas2'))
      const forceAtlas2 = module.default
      forceAtlas2.assign(target, {
        iterations,
        settings: { ...forceAtlas2.inferSettings(target), ...settings }
      })
      return
    }

    if (name === 'noverlap') {
      const module = await import('graphology-layout-noverlap').catch(() => missing('graphology-layout-noverlap'))
      module.default.assign(target, { settings })
      return
    }

    const module = await import('graphology-layout').catch(() => missing('graphology-layout'))
    module[name].assign(target, settings as never)
  }

  /**
   * 各分量单独布局后按外接圆打包。
   *
   * 打包借 `circlepack`——它本来就按节点 `size` 摆放不等圆，正是「摆一堆大小不一的分量」
   * 这件事；`rng` 固定而非 `Math.random`，同一份数据每次布局结果一致。
   */
  async function assignByComponent(target: Graph, gap: number, edgeLength: number) {
    const components = connectedComponents(target)
    if (components.length <= 1) {
      await loadOneShot(target)
      return
    }

    const module = await import('graphology-layout').catch(() => missing('graphology-layout'))
    const subs = extractComponents(target, components)
    const blocks: ComponentBlock[] = []

    for (const [position, sub] of subs.entries()) {
      seedMissingPositions(sub, edgeLength * Math.sqrt(sub.order))
      if (sub.order > 1) {
        await loadOneShot(sub)
      }
      normalizeScale(sub, edgeLength)
      blocks.push(measureComponent(components[position]!, sub))
    }

    const packer = new Graph()
    blocks.forEach((block, position) => {
      packer.addNode(String(position), { size: block.radius + gap / 2 })
    })
    module.circlepack.assign(packer, { rng: () => 0.5 })

    blocks.forEach((block, position) => {
      const offsetX = packer.getNodeAttribute(String(position), 'x') as number
      const offsetY = packer.getNodeAttribute(String(position), 'y') as number

      for (const key of block.keys) {
        target.mergeNodeAttributes(key, {
          x: (block.sub.getNodeAttribute(key, 'x') as number) - block.center.x + offsetX,
          y: (block.sub.getNodeAttribute(key, 'y') as number) - block.center.y + offsetY
        })
      }
    })
  }

  function assignLayout(target: Graph) {
    return component
      ? assignByComponent(target, component.gap, component.edgeLength)
      : loadOneShot(target)
  }

  async function ensureSupervisor(target: Graph): Promise<LayoutSupervisor> {
    if (supervisor) {
      return supervisor
    }

    if (name === 'forceatlas2') {
      const module = await import('graphology-layout-forceatlas2/worker').catch(() => missing('graphology-layout-forceatlas2'))
      const base = await import('graphology-layout-forceatlas2')
      supervisor = new module.default(target, {
        settings: { ...base.default.inferSettings(target), ...settings }
      }) as LayoutSupervisor
    }
    else {
      const module = await import('graphology-layout-noverlap/worker').catch(() => missing('graphology-layout-noverlap'))
      supervisor = new module.default(target, { settings }) as LayoutSupervisor
    }

    return supervisor
  }

  function kill() {
    supervisor?.kill()
    supervisor = null
    isRunning.value = false
  }

  onScopeDispose(kill)

  return {
    isSupervised,
    isRunning: readonly(isRunning),

    async assign() {
      await assignLayout(graph.value)
      sigma.value?.refresh()
    },

    async start() {
      if (!isSupervised || !worker) {
        await assignLayout(graph.value)
        sigma.value?.refresh()
        return
      }

      const instance = await ensureSupervisor(graph.value)
      instance.start()
      isRunning.value = instance.isRunning()
    },

    stop() {
      supervisor?.stop()
      isRunning.value = supervisor?.isRunning() ?? false
    },

    kill
  }
}

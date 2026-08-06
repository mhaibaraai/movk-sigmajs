import { onScopeDispose, readonly, shallowRef } from 'vue'
import type { Ref } from 'vue'
import type Graph from 'graphology'
import { useSigma } from './use-sigma'
import type { SigmaLayoutName } from '../types'

/** 支持后台持续迭代的布局，其余为一次性计算 */
const SUPERVISED_LAYOUTS = new Set<SigmaLayoutName>(['forceatlas2', 'noverlap'])

/** graphology 的布局 supervisor，两个 worker 包的形状一致 */
interface LayoutSupervisor {
  start: () => void
  stop: () => void
  kill: () => void
  isRunning: () => boolean
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
  const { worker = true, settings, iterations = 100 } = options
  const { graph, sigma } = useSigma()

  const isSupervised = SUPERVISED_LAYOUTS.has(name)
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
      await loadOneShot(graph.value)
      sigma.value?.refresh()
    },

    async start() {
      if (!isSupervised || !worker) {
        await loadOneShot(graph.value)
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

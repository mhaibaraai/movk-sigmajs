import type { FullEdgeState, FullGraphState, FullNodeState } from 'sigma/types'
import { useSigma } from './use-sigma'

export interface UseSigmaStateReturn<NS = object, ES = object, GS = object> {
  /** 设置单个节点的状态 */
  setNodeState: (key: string, state: Partial<FullNodeState<NS>>) => void
  /** 批量设置节点状态，比逐个调用少一次重绘 */
  setNodesState: (keys: string[], state: Partial<FullNodeState<NS>>) => void
  /** 设置单条边的状态 */
  setEdgeState: (key: string, state: Partial<FullEdgeState<ES>>) => void
  /** 批量设置边状态 */
  setEdgesState: (keys: string[], state: Partial<FullEdgeState<ES>>) => void
  /** 设置图级状态 */
  setGraphState: (state: Partial<FullGraphState<GS>>) => void
  /** 读取节点状态，实例未就绪时为 `undefined` */
  getNodeState: (key: string) => FullNodeState<NS> | undefined
  /** 读取边状态，实例未就绪时为 `undefined` */
  getEdgeState: (key: string) => FullEdgeState<ES> | undefined
  /** 读取图级状态，实例未就绪时为 `undefined` */
  getGraphState: () => FullGraphState<GS> | undefined
}

/**
 * 读写 sigma 的交互状态。
 *
 * 状态与图数据分离：`isHovered` / `isHighlighted` / `isHidden` 这类纯展示态存在 sigma
 * 内部，不污染 graphology 的属性，导出图数据时不会把 UI 状态一并带走。
 * styles 里用 `whenState` 消费这些状态，写入后 sigma 自行安排重绘。
 *
 * 泛型对应 `SigmaGraph` 的 `customNodeState` / `customEdgeState` / `customGraphState`，
 * 自定义标志位的键名不能与内置状态冲突。
 *
 * 实例未就绪时写入静默跳过——服务端与挂载完成前都没有实例可写。
 *
 * @example
 * ```ts
 * const { setNodeState } = useSigmaState<{ isPinned: boolean }>()
 * setNodeState('n1', { isPinned: true })
 * ```
 */
export function useSigmaState<NS = object, ES = object, GS = object>(): UseSigmaStateReturn<NS, ES, GS> {
  const { sigma } = useSigma()

  return {
    setNodeState(key, state) {
      sigma.value?.setNodeState(key, state)
    },
    setNodesState(keys, state) {
      sigma.value?.setNodesState(keys, state)
    },
    setEdgeState(key, state) {
      sigma.value?.setEdgeState(key, state)
    },
    setEdgesState(keys, state) {
      sigma.value?.setEdgesState(keys, state)
    },
    setGraphState(state) {
      sigma.value?.setGraphState(state)
    },
    getNodeState(key) {
      return sigma.value?.getNodeState(key) as FullNodeState<NS> | undefined
    },
    getEdgeState(key) {
      return sigma.value?.getEdgeState(key) as FullEdgeState<ES> | undefined
    },
    getGraphState() {
      return sigma.value?.getGraphState() as FullGraphState<GS> | undefined
    }
  }
}

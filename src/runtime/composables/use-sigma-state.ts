import type { BaseEdgeState, BaseGraphState, BaseNodeState } from 'sigma/types'
import { useSigma } from './use-sigma'

export interface UseSigmaStateReturn {
  /** 设置单个节点的状态 */
  setNodeState: (key: string, state: Partial<BaseNodeState>) => void
  /** 批量设置节点状态，比逐个调用少一次重绘 */
  setNodesState: (keys: string[], state: Partial<BaseNodeState>) => void
  /** 设置单条边的状态 */
  setEdgeState: (key: string, state: Partial<BaseEdgeState>) => void
  /** 批量设置边状态 */
  setEdgesState: (keys: string[], state: Partial<BaseEdgeState>) => void
  /** 设置图级状态 */
  setGraphState: (state: Partial<BaseGraphState>) => void
  /** 读取节点状态，实例未就绪时为 `undefined` */
  getNodeState: (key: string) => BaseNodeState | undefined
  /** 读取边状态，实例未就绪时为 `undefined` */
  getEdgeState: (key: string) => BaseEdgeState | undefined
  /** 读取图级状态，实例未就绪时为 `undefined` */
  getGraphState: () => BaseGraphState | undefined
}

/**
 * 读写 sigma 的交互状态。
 *
 * 状态与图数据分离：`isHovered` / `isHighlighted` / `isHidden` 这类纯展示态存在 sigma
 * 内部，不污染 graphology 的属性，因此导出图数据时不会把 UI 状态一并带走。
 * styles 里用 `whenState` 消费这些状态。
 *
 * 实例未就绪时写入静默跳过——服务端与挂载完成前都没有实例可写。
 *
 * @example
 * ```ts
 * const { setNodeState } = useSigmaState()
 * setNodeState('n1', { isHighlighted: true })
 * ```
 */
export function useSigmaState(): UseSigmaStateReturn {
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
      return sigma.value?.getNodeState(key)
    },
    getEdgeState(key) {
      return sigma.value?.getEdgeState(key)
    },
    getGraphState() {
      return sigma.value?.getGraphState()
    }
  }
}

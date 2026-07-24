import { computed, readonly, shallowRef, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { EdgeDisplayData, NodeDisplayData } from 'sigma/types'
import { useSigma } from './use-sigma'
import { useSigmaEvents } from './use-sigma-events'
import { useSigmaReducer } from './use-sigma-reducer'

export interface UseSigmaSelectionOptions {
  /**
   * 悬浮节点时进入高亮
   * @defaultValue true
   */
  hover?: boolean
  /**
   * 点击节点选中，再次点击同一节点取消；点击空白处清空
   * @defaultValue true
   */
  click?: boolean
  /**
   * 高亮时把无关的节点与边淡出
   * @defaultValue true
   */
  dim?: boolean
  /**
   * 淡出后的颜色
   * @defaultValue '#d1d5db'
   */
  dimColor?: string
  /**
   * reducer 链内次序
   * @defaultValue 100
   */
  order?: number
}

export interface UseSigmaSelectionReturn {
  /** 当前悬浮的节点 */
  hovered: Readonly<Ref<string | null>>
  /** 当前选中的节点，可写 */
  selected: Ref<string | null>
  /** 当前焦点，选中优先于悬浮 */
  focused: ComputedRef<string | null>
  /** 焦点节点及其直接邻居 */
  highlighted: ComputedRef<Set<string>>
  /** 设置选中，传 `null` 清空 */
  select: (key: string | null) => void
  /** 清空悬浮与选中 */
  clear: () => void
}

/**
 * 悬浮与选中的状态机，并内建高亮与淡出的归约。
 *
 * 焦点节点及其直接邻居保持原样，其余淡出且隐藏标签。归约经 reducer 链登记，
 * 与过滤、图例显隐等其他归约共存而不互相覆盖。
 */
export function useSigmaSelection(options: UseSigmaSelectionOptions = {}): UseSigmaSelectionReturn {
  const { hover = true, click = true, dim = true, dimColor = '#d1d5db', order = 100 } = options

  const { graph } = useSigma()
  const hovered = shallowRef<string | null>(null)
  const selected = shallowRef<string | null>(null)

  const focused = computed(() => selected.value ?? hovered.value)

  const highlighted = computed(() => {
    const focus = focused.value
    if (!focus || !graph.value.hasNode(focus)) {
      return new Set<string>()
    }
    return new Set([focus, ...graph.value.neighbors(focus)])
  })

  const { refresh } = useSigmaReducer({
    order,
    node(key, data) {
      const focus = focused.value
      if (!focus) {
        return data as Partial<NodeDisplayData>
      }
      if (key === focus) {
        return { ...data, highlighted: true, zIndex: 1 } as Partial<NodeDisplayData>
      }
      if (highlighted.value.has(key) || !dim) {
        return data as Partial<NodeDisplayData>
      }
      return { ...data, color: dimColor, label: null, zIndex: 0 } as Partial<NodeDisplayData>
    },
    edge(key, data) {
      const focus = focused.value
      if (!focus || !dim) {
        return data as Partial<EdgeDisplayData>
      }
      if (graph.value.hasEdge(key) && graph.value.hasExtremity(key, focus)) {
        return { ...data, zIndex: 1 } as Partial<EdgeDisplayData>
      }
      return { ...data, color: dimColor, label: null, zIndex: 0 } as Partial<EdgeDisplayData>
    }
  })

  // 归约函数本身不变，变的是它读取的焦点，需要主动让 sigma 重跑
  watch(focused, refresh)

  if (hover) {
    useSigmaEvents({
      enterNode: ({ node }) => {
        hovered.value = node
      },
      leaveNode: () => {
        hovered.value = null
      }
    })
  }

  if (click) {
    useSigmaEvents({
      clickNode: ({ node }) => {
        selected.value = selected.value === node ? null : node
      },
      clickStage: () => {
        selected.value = null
      }
    })
  }

  return {
    hovered: readonly(hovered),
    selected,
    focused,
    highlighted,
    select(key) {
      selected.value = key
    },
    clear() {
      hovered.value = null
      selected.value = null
    }
  }
}

import { computed, onScopeDispose, readonly, shallowRef, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { useSigma } from './use-sigma'
import { useSigmaEvents } from './use-sigma-events'
import { useSigmaState } from './use-sigma-state'

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
   * 高亮时把无关的节点与边淡出。关掉后只写 `isHighlighted` 状态，
   * 外观完全交给 styles 的 `whenState` 规则
   * @defaultValue true
   */
  dim?: boolean
  /**
   * 淡出后的颜色
   * @defaultValue '#d1d5db'
   */
  dimColor?: string
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
 * 悬浮与选中的状态机，把焦点及其邻居写进 sigma 的 `isHighlighted` 状态。
 *
 * 状态与外观分离：本 composable 只负责「谁被高亮」，`dim` 打开时由库内规则把无关元素
 * 淡出，需要自定义外观时关掉它并在 styles 里写 `whenState: 'isHighlighted'`。
 */
export function useSigmaSelection(options: UseSigmaSelectionOptions = {}): UseSigmaSelectionReturn {
  const { hover = true, click = true, dim = true, dimColor = '#d1d5db' } = options

  const { graph, styleOptions } = useSigma()
  const { setNodesState, setEdgesState } = useSigmaState()

  styleOptions.dimColor.value = dim ? dimColor : null
  onScopeDispose(() => {
    styleOptions.dimColor.value = null
  })

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

  const highlightedEdges = computed(() => {
    const focus = focused.value
    if (!focus || !graph.value.hasNode(focus)) {
      return new Set<string>()
    }
    return new Set(graph.value.edges(focus))
  })

  let previousNodes: string[] = []
  let previousEdges: string[] = []

  function syncState() {
    const nextNodes = [...highlighted.value]
    const nextEdges = [...highlightedEdges.value]

    const clearedNodes = previousNodes.filter(key => !highlighted.value.has(key))
    const clearedEdges = previousEdges.filter(key => !highlightedEdges.value.has(key))

    if (clearedNodes.length > 0) {
      setNodesState(clearedNodes, { isHighlighted: false })
    }
    if (clearedEdges.length > 0) {
      setEdgesState(clearedEdges, { isHighlighted: false })
    }
    if (nextNodes.length > 0) {
      setNodesState(nextNodes, { isHighlighted: true })
    }
    if (nextEdges.length > 0) {
      setEdgesState(nextEdges, { isHighlighted: true })
    }

    previousNodes = nextNodes
    previousEdges = nextEdges
  }

  watch(focused, syncState)

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

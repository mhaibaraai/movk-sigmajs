import { computed, readonly, shallowRef, toValue, watch } from 'vue'
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import { useSigma } from './use-sigma'
import { useSigmaEvents } from './use-sigma-events'

export interface UseSigmaDragOptions {
  /**
   * 是否启用拖拽
   * @defaultValue true
   */
  enabled?: MaybeRefOrGetter<boolean>
  /** 拖拽开始 */
  onStart?: (node: string, allDraggedNodes: string[]) => void
  /** 拖拽结束 */
  onEnd?: (node: string, allDraggedNodes: string[]) => void
}

export interface UseSigmaDragReturn {
  /** 正在拖拽的节点，未拖拽时为 `null` */
  dragged: Readonly<Ref<string | null>>
  /** 本次拖拽实际移动的全部节点，由 `getDraggedNodes` 决定 */
  draggedNodes: Readonly<Ref<string[]>>
  /** 是否正在拖拽 */
  isDragging: ComputedRef<boolean>
}

/**
 * 拖拽移动节点。
 *
 * 拖拽本身由 sigma 的 `enableNodeDrag` 实现，本 composable 只把它接进 Vue 的响应式：
 * 开关跟随 `enabled`，过程暴露为 `dragged` 与 `isDragging`。
 *
 * 被拖拽的节点自带 `isDragged` 状态，styles 里用 `whenState: 'isDragged'` 改外观。
 * 一次拖多个节点用 `settings.getDraggedNodes`，写回的属性用 `settings.dragPositionToAttributes`。
 *
 * 与迭代型布局互斥：ForceAtlas2 之类的 worker 在跑时会持续回写坐标，
 * 拖拽结果会被立刻覆盖。需要手动摆位时先 `useSigmaLayout(...).stop()`。
 */
export function useSigmaDrag(options: UseSigmaDragOptions = {}): UseSigmaDragReturn {
  const { enabled = true, onStart, onEnd } = options

  const { sigma } = useSigma()
  const dragged = shallowRef<string | null>(null)
  const draggedNodes = shallowRef<string[]>([])

  watch(
    [sigma, () => toValue(enabled)],
    ([instance, isEnabled]) => {
      instance?.setSetting('enableNodeDrag', isEnabled)
    },
    { immediate: true }
  )

  useSigmaEvents({
    nodeDragStart: ({ node, allDraggedNodes }) => {
      dragged.value = node
      draggedNodes.value = allDraggedNodes
      onStart?.(node, allDraggedNodes)
    },
    nodeDragEnd: ({ node, allDraggedNodes }) => {
      dragged.value = null
      draggedNodes.value = []
      onEnd?.(node, allDraggedNodes)
    }
  })

  return {
    dragged: readonly(dragged),
    draggedNodes: readonly(draggedNodes) as Readonly<Ref<string[]>>,
    isDragging: computed(() => dragged.value !== null)
  }
}

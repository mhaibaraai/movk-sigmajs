import { useEventListener } from '@vueuse/core'
import { computed, onScopeDispose, shallowRef } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { useSigma } from './use-sigma'
import { useSigmaEvents } from './use-sigma-events'

export interface UseSigmaDragOptions {
  /**
   * 是否启用拖拽
   * @defaultValue true
   */
  enabled?: boolean
  /**
   * 拖拽过程中给节点写 `highlighted`，让它在视觉上浮起
   * @defaultValue true
   */
  highlight?: boolean
  /** 拖拽开始 */
  onStart?: (node: string) => void
  /** 拖拽结束，无论是正常释放还是在画布外释放 */
  onEnd?: (node: string) => void
}

export interface UseSigmaDragReturn {
  /** 正在拖拽的节点，未拖拽时为 `null` */
  dragged: Readonly<Ref<string | null>>
  /** 是否正在拖拽 */
  isDragging: ComputedRef<boolean>
  /** 主动结束拖拽 */
  stop: () => void
}

/**
 * 拖拽移动节点。
 *
 * 按下节点后阻止 sigma 的默认行为，否则相机会跟着一起平移；移动时把视口坐标
 * 换算回图坐标写进节点的 `x` / `y`。鼠标在画布之外释放时靠 window 上的
 * `mouseup` 兜底，避免节点粘在指针上。
 *
 * 与迭代型布局互斥：ForceAtlas2 之类的 worker 在跑时会持续回写坐标，
 * 拖拽结果会被立刻覆盖。需要手动摆位时先 `useSigmaLayout(...).stop()`。
 */
export function useSigmaDrag(options: UseSigmaDragOptions = {}): UseSigmaDragReturn {
  const { enabled = true, highlight = true, onStart, onEnd } = options

  const { sigma, graph } = useSigma()
  const dragged = shallowRef<string | null>(null)

  function stop() {
    const node = dragged.value
    if (node === null) {
      return
    }

    if (highlight && graph.value.hasNode(node)) {
      graph.value.removeNodeAttribute(node, 'highlighted')
    }

    dragged.value = null
    onEnd?.(node)
  }

  useSigmaEvents({
    downNode: ({ node, event }) => {
      if (!enabled) {
        return
      }
      // 不阻止的话，按下节点会被 sigma 当成开始平移相机
      event.preventSigmaDefault()
      dragged.value = node

      if (highlight) {
        graph.value.setNodeAttribute(node, 'highlighted', true)
      }
      onStart?.(node)
    },

    moveBody: ({ event }) => {
      const node = dragged.value
      const instance = sigma.value

      if (node === null || !instance) {
        return
      }

      event.preventSigmaDefault()

      if (!graph.value.hasNode(node)) {
        stop()
        return
      }

      const position = instance.viewportToGraph({ x: event.x, y: event.y })
      graph.value.setNodeAttribute(node, 'x', position.x)
      graph.value.setNodeAttribute(node, 'y', position.y)
    },

    upNode: stop,
    upStage: stop
  })

  // 指针移出画布再松开时 sigma 收不到 up 事件，节点会一直粘着
  useEventListener(typeof window === 'undefined' ? null : window, 'mouseup', stop)

  onScopeDispose(stop)

  return {
    dragged,
    isDragging: computed(() => dragged.value !== null),
    stop
  }
}

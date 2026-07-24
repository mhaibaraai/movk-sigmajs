<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import type { Attributes } from 'graphology-types'
import type { Coordinates, MouseCoords } from 'sigma/types'
import { useSigma } from '../composables/use-sigma'
import { useSigmaEvents } from '../composables/use-sigma-events'
import SigmaOverlay from './Overlay.vue'

defineOptions({ name: 'SigmaContextMenu', inheritAttrs: false })

const props = withDefaults(defineProps<{
  /**
   * 响应的图元类型。`stage` 即空白处右键
   * @defaultValue `['node']`
   */
  target?: Array<'node' | 'edge' | 'stage'>
  /**
   * 相对锚点的像素偏移 `[x, y]`
   * @defaultValue `[4, 4]`
   */
  offset?: [number, number]
}>(), {
  target: () => ['node'],
  offset: () => [4, 4]
})

const { sigma, graph } = useSigma()

const hit = shallowRef<{ type: 'node' | 'edge' | 'stage', key: string | null, position?: Coordinates } | null>(null)

const attributes = computed<Attributes>(() => {
  const current = hit.value
  if (!current?.key) {
    return {}
  }
  if (current.type === 'node') {
    return graph.value.hasNode(current.key) ? graph.value.getNodeAttributes(current.key) : {}
  }
  return graph.value.hasEdge(current.key) ? graph.value.getEdgeAttributes(current.key) : {}
})

const anchorNode = computed(() => {
  const current = hit.value
  if (!current) {
    return undefined
  }
  if (current.type === 'node' && current.key) {
    return current.key
  }
  if (current.type === 'edge' && current.key && graph.value.hasEdge(current.key)) {
    return graph.value.source(current.key)
  }
  return undefined
})

function accepts(type: 'node' | 'edge' | 'stage') {
  return props.target.includes(type)
}

function close() {
  hit.value = null
}

/**
 * 接管这次右键。
 *
 * `preventSigmaDefault()` 只拦 sigma 自己的默认行为，浏览器原生菜单照样弹出。
 * sigma 的鼠标捕获器直接监听 DOM 的 `contextmenu` 事件且未调用 `preventDefault()`，
 * 我们的处理函数是在那个监听器里同步执行的，因此在此拦住原生事件即可。
 * 只在确实接管的目标上拦截，未接管的仍让浏览器菜单正常弹出。
 */
function take(event: MouseCoords) {
  event.preventSigmaDefault()
  event.original.preventDefault()
}

useSigmaEvents({
  rightClickNode: ({ node, event }) => {
    if (accepts('node')) {
      take(event)
      hit.value = { type: 'node', key: node }
    }
  },
  rightClickEdge: ({ edge, event }) => {
    if (accepts('edge')) {
      take(event)
      hit.value = { type: 'edge', key: edge }
    }
  },
  rightClickStage: ({ event }) => {
    if (!accepts('stage')) {
      close()
      return
    }
    take(event)
    const instance = sigma.value
    hit.value = {
      type: 'stage',
      key: null,
      position: instance ? instance.viewportToGraph({ x: event.x, y: event.y }) : undefined
    }
  },
  clickStage: close,
  clickNode: close
})

defineExpose({ close })
</script>

<template>
  <SigmaOverlay
    :node="anchorNode"
    :position="hit?.position"
    :offset="offset"
    :visible="hit !== null"
    class="sigma-context-menu"
    v-bind="$attrs"
  >
    <!-- 插槽的键名用 id 而非 key：key 是 Vue 的保留属性，工具链会按特殊属性处理 -->
    <slot
      v-if="hit"
      :id="hit.key"
      :type="hit.type"
      :attributes="attributes"
      :close="close"
    />
  </SigmaOverlay>
</template>

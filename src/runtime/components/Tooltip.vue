<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import type { Attributes } from 'graphology-types'
import { useSigma } from '../composables/use-sigma'
import { useSigmaEvents } from '../composables/use-sigma-events'
import SigmaOverlay from './Overlay.vue'

defineOptions({ name: 'SigmaTooltip', inheritAttrs: false })

const props = withDefaults(defineProps<{
  /**
   * 触发方式
   * @defaultValue 'hover'
   */
  trigger?: 'hover' | 'click'
  /**
   * 响应的图元类型。边事件需要 `settings.enableEdgeEvents` 为 true
   * @defaultValue 'node'
   */
  target?: 'node' | 'edge' | 'both'
  /**
   * 相对锚点的像素偏移 `[x, y]`
   * @defaultValue `[0, -12]`
   */
  offset?: [number, number]
}>(), {
  trigger: 'hover',
  target: 'node',
  offset: () => [0, -12]
})

const { graph } = useSigma()

const hit = shallowRef<{ type: 'node' | 'edge', key: string } | null>(null)

const attributes = computed<Attributes>(() => {
  const current = hit.value
  if (!current) {
    return {}
  }
  if (current.type === 'node') {
    return graph.value.hasNode(current.key) ? graph.value.getNodeAttributes(current.key) : {}
  }
  return graph.value.hasEdge(current.key) ? graph.value.getEdgeAttributes(current.key) : {}
})

// 边没有单一锚点，取源节点定位
const anchorNode = computed(() => {
  const current = hit.value
  if (!current) {
    return undefined
  }
  if (current.type === 'node') {
    return current.key
  }
  return graph.value.hasEdge(current.key) ? graph.value.source(current.key) : undefined
})

const wantsNode = computed(() => props.target === 'node' || props.target === 'both')
const wantsEdge = computed(() => props.target === 'edge' || props.target === 'both')

function show(type: 'node' | 'edge', key: string) {
  hit.value = { type, key }
}

function hide() {
  hit.value = null
}

useSigmaEvents({
  enterNode: ({ node }) => {
    if (props.trigger === 'hover' && wantsNode.value) {
      show('node', node)
    }
  },
  leaveNode: () => {
    if (props.trigger === 'hover' && wantsNode.value) {
      hide()
    }
  },
  enterEdge: ({ edge }) => {
    if (props.trigger === 'hover' && wantsEdge.value) {
      show('edge', edge)
    }
  },
  leaveEdge: () => {
    if (props.trigger === 'hover' && wantsEdge.value) {
      hide()
    }
  },
  clickNode: ({ node }) => {
    if (props.trigger === 'click' && wantsNode.value) {
      show('node', node)
    }
  },
  clickEdge: ({ edge }) => {
    if (props.trigger === 'click' && wantsEdge.value) {
      show('edge', edge)
    }
  },
  clickStage: hide
})

defineExpose({ hide })
</script>

<template>
  <SigmaOverlay
    :node="anchorNode"
    :offset="offset"
    :visible="hit !== null"
    class="sigma-tooltip"
    v-bind="$attrs"
  >
    <slot
      v-if="hit"
      :id="hit.key"
      :type="hit.type"
      :attributes="attributes"
    >
      {{ attributes.label ?? hit.key }}
    </slot>
  </SigmaOverlay>
</template>

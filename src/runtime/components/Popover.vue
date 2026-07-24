<script setup lang="ts">
import { computed } from 'vue'
import type { Attributes } from 'graphology-types'
import { useSigma } from '../composables/use-sigma'
import SigmaOverlay from './Overlay.vue'

defineOptions({ name: 'SigmaPopover', inheritAttrs: false })

const props = withDefaults(defineProps<{
  /** 锚定的节点。为空时不显示 */
  node?: string | null
  /**
   * 相对锚点的像素偏移 `[x, y]`
   * @defaultValue `[0, -16]`
   */
  offset?: [number, number]
}>(), {
  node: null,
  offset: () => [0, -16]
})

const open = defineModel<boolean>('open', { default: true })

const { graph } = useSigma()

const attributes = computed<Attributes>(() =>
  props.node && graph.value.hasNode(props.node) ? graph.value.getNodeAttributes(props.node) : {}
)

const visible = computed(() => open.value && Boolean(props.node))

function close() {
  open.value = false
}
</script>

<template>
  <SigmaOverlay
    :node="node ?? undefined"
    :offset="offset"
    :visible="visible"
    class="sigma-popover"
    v-bind="$attrs"
  >
    <!-- 隐藏时不渲染插槽：覆盖层用 v-show 保留 DOM，若插槽照常渲染，
         使用方会拿到 node 为 null 的作用域，且隐藏内容仍可被点击 -->
    <slot
      v-if="visible && node"
      :node="node"
      :attributes="attributes"
      :close="close"
    />
  </SigmaOverlay>
</template>

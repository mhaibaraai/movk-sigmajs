<script setup lang="ts">
import { shallowRef } from 'vue'
import type { EdgeDisplayData, NodeDisplayData } from 'sigma/types'

/**
 * 往 reducer 链登记归约，作用域销毁时自动注销。
 *
 * sigma 各只接受一个 nodeReducer / edgeReducer，后设置的会覆盖先设置的。
 * 链按 order 升序执行，后者的返回值浅合并覆盖前者，于是高亮、过滤、图例显隐
 * 这些独立关注点能共存。此处的自定义归约 order 为 400，排在
 * 选中高亮（100）与过滤（50）之后，所以它的着色最终生效。
 */
const ring = shallowRef(true)

useSigmaSelection()
useSigmaFilter()

const { refresh } = useSigmaReducer({
  order: 400,
  node: (_key, attributes): Partial<NodeDisplayData> =>
    ring.value && attributes.category === '应急预案'
      ? { color: '#f59e0b', size: (attributes.size ?? 8) * 1.6, forceLabel: true }
      : {},
  edge: (): Partial<EdgeDisplayData> => (ring.value ? { size: 2 } : {})
})

function toggle() {
  ring.value = !ring.value
  refresh()
}
</script>

<template>
  <div class="demo-panel" data-at="top-left">
    <div class="demo-row">
      <button type="button" :aria-pressed="ring" @click="toggle">
        突出「应急预案」
      </button>
    </div>
    <span class="demo-tag">与内建的选中高亮、过滤同时在链上，点击节点可验证互不覆盖</span>
  </div>
</template>

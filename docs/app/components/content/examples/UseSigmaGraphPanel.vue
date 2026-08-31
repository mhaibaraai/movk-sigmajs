<script setup lang="ts">
import { shallowRef } from 'vue'

/**
 * graphology 的 Graph 是纯可变对象，Vue 的响应式系统抓不到它的变更。
 * useSigmaGraph 订阅图事件并把变更桥接成 version / order / size，
 * 下游用常规的 computed 与 watch 即可响应。
 */
const { graph, version, order, size, onGraphUpdate } = useSigmaGraph()

const updates = shallowRef(0)
onGraphUpdate(() => {
  updates.value += 1
})

let seq = 0

function addNode() {
  seq += 1
  const key = `extra-${seq}`
  graph.value.addNode(key, { label: key, x: Math.cos(seq) * 220, y: Math.sin(seq) * 220, size: 8, color: '#f59e0b' })
  graph.value.addEdge('n0', key)
}

function recolor() {
  graph.value.setNodeAttribute('n0', 'color', `hsl(${(seq += 40) % 360} 70% 55%)`)
}
</script>

<template>
  <SigmaControls>
    <div class="flex gap-1">
      <UButton size="xs" color="neutral" label="addNode" @click="addNode" />
      <UButton size="xs" color="neutral" label="改属性" @click="recolor" />
    </div>

    <div class="bg-accented p-2 text-muted text-xs">
      version {{ version }} · 节点 {{ order }} · 边 {{ size }} · 回调 {{ updates }} 次
    </div>
  </SigmaControls>
</template>

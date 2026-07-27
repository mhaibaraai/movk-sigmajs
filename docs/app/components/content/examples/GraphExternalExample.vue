<script setup lang="ts">
import Graph from 'graphology'
import { shallowRef } from 'vue'

// graph 通道：传入外部实例后库完全不碰数据，只负责渲染与生命周期。
// 图可以用 graphology 生态的任何方式操作，sigma 靠图事件自动重绘
const graph = new Graph()
graph.addNode('x', { label: '外部 X', x: 0, y: 0, size: 14, color: '#0ea5e9' })
graph.addNode('y', { label: '外部 Y', x: 12, y: 5, size: 12, color: '#0ea5e9' })
graph.addEdge('x', 'y', { label: '引用' })

const order = shallowRef(graph.order)
const seq = shallowRef(0)

// 直接调 graphology 的原生 API，不经过任何库的封装
function mutate() {
  seq.value += 1
  const key = `z${seq.value}`
  graph.addNode(key, { label: key, x: Math.cos(seq.value) * 12, y: Math.sin(seq.value) * 12, size: 9, color: '#f59e0b' })
  graph.addEdge('x', key)
  order.value = graph.order
}
</script>

<template>
  <SigmaGraph :graph="graph" :settings="{ renderEdgeLabels: true }">
    <div class="demo-panel" data-at="top-left">
      <div class="demo-row">
        <button type="button" @click="mutate">
          graph.addNode()
        </button>
        <span class="demo-tag">节点数 {{ order }}</span>
      </div>
      <span class="demo-tag">data 与 diff 在这条通道下不生效，数据完全由调用方掌控</span>
    </div>
  </SigmaGraph>
</template>

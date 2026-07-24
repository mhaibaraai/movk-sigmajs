<script setup lang="ts">
import Graph from 'graphology'
import type { SerializedGraph } from 'graphology-types'

const graph = new Graph()

const initial: SerializedGraph = {
  attributes: {},
  options: { type: 'mixed', multi: false, allowSelfLoops: true },
  nodes: [
    { key: 'a', attributes: { label: '节点 A', x: 0, y: 0, size: 12 } },
    { key: 'b', attributes: { label: '节点 B', x: 10, y: 4, size: 10 } }
  ],
  edges: [
    { source: 'a', target: 'b', attributes: { label: '关联' } }
  ]
}

applyGraphDiff(graph, initial)

// 保留坐标验证：新数据不带 x / y，已有节点的布局结果不应丢失
const expanded: SerializedGraph = {
  ...initial,
  nodes: [
    { key: 'a', attributes: { label: '节点 A', size: 12 } },
    { key: 'b', attributes: { label: '节点 B', size: 10 } },
    { key: 'c', attributes: { label: '节点 C', x: 6, y: -3, size: 8 } }
  ],
  edges: [
    { source: 'a', target: 'b', attributes: { label: '关联' } },
    { source: 'b', target: 'c', attributes: { label: '新增关联' } }
  ]
}

applyGraphDiff(graph, expanded, { prune: false })

const snapshot = computed(() =>
  graph.nodes().map(key => ({ key, ...graph.getNodeAttributes(key) }))
)
</script>

<template>
  <main>
    <h1>@movk/sigma playground</h1>
    <p>节点 {{ graph.order }} 个，边 {{ graph.size }} 条。</p>
    <pre>{{ snapshot }}</pre>
    <p>
      渲染组件与 composables 尚未实现，当前仅验证模块注册与工具函数的自动导入。
    </p>
  </main>
</template>

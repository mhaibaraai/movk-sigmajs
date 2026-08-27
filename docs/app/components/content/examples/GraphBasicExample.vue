<script setup lang="ts">
import type { SerializedGraph } from 'graphology-types'

const data = ref<SerializedGraph>({
  attributes: {},
  options: { type: 'mixed', multi: false, allowSelfLoops: true },
  nodes: [
    { key: 'a', attributes: { label: '制度 A', x: 0, y: 0, size: 14, color: '#f43f5e' } },
    { key: 'b', attributes: { label: '制度 B', x: 320, y: 140, size: 11, color: '#3b82f6' } },
    { key: 'c', attributes: { label: '制度 C', x: 160, y: -220, size: 10, color: '#22c55e' } }
  ],
  edges: [
    { source: 'a', target: 'b', attributes: { label: '引用' } },
    { source: 'a', target: 'c', attributes: { label: '替代' } }
  ]
})

const seq = ref(0)

function add() {
  seq.value += 1
  const key = `n${seq.value}`
  const angle = seq.value * 1.2

  data.value = {
    ...data.value,
    nodes: [
      ...data.value.nodes,
      { key, attributes: { label: `新增 ${seq.value}`, x: Math.cos(angle) * 180, y: Math.sin(angle) * 180, size: 8, color: '#a855f7' } }
    ],
    edges: [...data.value.edges, { source: 'a', target: key, attributes: { label: '引用' } }]
  }
}

function remove() {
  const key = `n${seq.value}`
  seq.value -= 1

  data.value = {
    ...data.value,
    nodes: data.value.nodes.filter(node => node.key !== key),
    edges: data.value.edges.filter(edge => edge.target !== key)
  }
}
</script>

<template>
  <SigmaGraph :data="data" :settings="{ renderEdgeLabels: true }">
    <SigmaControls>
      <UButton label="新增节点" @click="add" />
      <UButton :disabled="seq === 0" label="移除最后一个" @click="remove" />
    </SigmaControls>
  </SigmaGraph>
</template>

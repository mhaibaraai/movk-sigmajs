<script setup lang="ts">
import type { SerializedGraph } from 'graphology-types'

const data = ref<SerializedGraph>({
  attributes: {},
  options: { type: 'mixed', multi: false, allowSelfLoops: true },
  nodes: [
    { key: 'a', attributes: { label: 'A', x: 0, y: 0, size: 20, color: '#e22653' } },
    { key: 'b', attributes: { label: 'B', x: 100, y: -100, size: 40, color: '#e28b53' } },
    { key: 'c', attributes: { label: 'C', x: 300, y: -200, size: 20, color: '#9be225' } },
    { key: 'd', attributes: { label: 'D', x: 100, y: -300, size: 20, color: '#53a4e2' } },
    { key: 'e', attributes: { label: 'E', x: 300, y: -400, size: 40, color: '#7553e2' } },
    { key: 'f', attributes: { label: 'F', x: 400, y: -500, size: 20, color: '#e253d5' } }
  ],
  edges: [
    { source: 'a', target: 'b', attributes: { size: 10 } },
    { source: 'b', target: 'c', attributes: { size: 10 } },
    { source: 'b', target: 'd', attributes: { size: 10 } },
    { source: 'c', target: 'b', attributes: { size: 10 } },
    { source: 'c', target: 'e', attributes: { size: 10 } },
    { source: 'd', target: 'c', attributes: { size: 10 } },
    { source: 'd', target: 'e', attributes: { size: 10 } },
    { source: 'e', target: 'd', attributes: { size: 10 } },
    { source: 'f', target: 'e', attributes: { size: 10 } }
  ]
})

const seq = ref(0)

function add() {
  const n = ++seq.value
  const angle = n * 1.2
  const key = `n${n}`

  data.value = {
    ...data.value,
    nodes: [...data.value.nodes, { key, attributes: { label: `新增 ${n}`, x: Math.cos(angle) * 180, y: Math.sin(angle) * 180, size: 8, color: '#a855f7' } }],
    edges: [...data.value.edges, { source: 'a', target: key }]
  }
}

function remove() {
  const key = `n${seq.value--}`

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

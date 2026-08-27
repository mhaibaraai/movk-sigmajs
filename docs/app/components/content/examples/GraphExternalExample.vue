<script setup lang="ts">
import Graph from 'graphology'

const graph = new Graph()
graph.addNode('x', { label: '外部 X', x: 0, y: 0, size: 14, color: '#0ea5e9' })
graph.addNode('y', { label: '外部 Y', x: 340, y: 300, size: 12, color: '#0ea5e9' })
graph.addEdge('x', 'y', { label: '引用' })

const seq = shallowRef(0)

function mutate() {
  seq.value += 1
  const key = `z${seq.value}`
  graph.addNode(key, { label: key, x: Math.cos(seq.value) * 180, y: Math.sin(seq.value) * 180, size: 9, color: '#f59e0b' })
  graph.addEdge('x', key)
}
</script>

<template>
  <SigmaGraph :graph="graph">
    <SigmaControls>
      <UButton type="button" @click="mutate">
        graph.addNode()
      </UButton>
    </SigmaControls>
  </SigmaGraph>
</template>

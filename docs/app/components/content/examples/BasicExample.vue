<script lang="ts" setup>
import type { SerializedGraph } from 'graphology-types'

const data: SerializedGraph = {
  attributes: {},
  options: { type: 'mixed', multi: false, allowSelfLoops: true },
  nodes: [
    { key: '1', attributes: { label: 'Node 1', x: 0, y: 0, size: 1, color: 'blue' } },
    { key: '2', attributes: { label: 'Node 2', x: 5, y: 10, size: 1, color: 'red' } },
    { key: '3', attributes: { label: 'Node 3', x: 10, y: 0, size: 1, color: 'green' } }
  ],
  edges: [
    { source: '1', target: '2', attributes: { size: 1 } },
    { source: '2', target: '3', attributes: { size: 1 } },
    { source: '3', target: '1', attributes: { size: 1 } }
  ]
}
</script>

<template>
  <SigmaGraph :data="data" />
</template>

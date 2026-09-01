<script setup lang="ts">
import Graph from 'graphology'
import type { SerializedGraph } from 'graphology-types'

const { data } = await useFetch('/api/data.json')

const payload = data.value as unknown as SerializedGraph
const graph = new Graph(payload.options)
graph.import(payload)
</script>

<template>
  <SigmaGraph :graph="graph">
    <ApplyGraphDiffPanel />
  </SigmaGraph>
</template>

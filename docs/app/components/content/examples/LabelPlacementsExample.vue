<script setup lang="ts">
import Graph from 'graphology'
import type { SerializedGraph } from 'graphology-types'
import type { SigmaStyles } from '@movk/sigma'

const { data } = await useFetch('/api/data.json')

const payload = data.value as unknown as SerializedGraph
const graph = new Graph(payload.options)
graph.import(payload)

const styles: SigmaStyles = {
  nodes: {
    labelPosition: { attribute: 'labelPlacement', defaultValue: 'below' },
    labelSize: 12
  }
}
</script>

<template>
  <SigmaGraph :graph="graph" :styles="styles" :settings="{ renderEdgeLabels: false }">
    <LabelPlacementsPanel />
  </SigmaGraph>
</template>

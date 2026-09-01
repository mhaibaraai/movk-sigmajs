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
    labelSize: { attribute: 'labelTier', dict: { 0: 16, 1: 13, 2: 11 }, defaultValue: 12 },
    labelColor: { attribute: 'labelTier', dict: { 0: '#0f172a', 1: '#334155', 2: '#94a3b8' }, defaultValue: '#334155' },
    // 0 档避无可避时仍强行绘制，其余让标签网格决定
    labelVisibility: { whenData: { labelTier: 0 }, then: 'visible', else: 'auto' }
  }
}
</script>

<template>
  <SigmaGraph :graph="graph" :styles="styles" :settings="{ renderEdgeLabels: false }">
    <DegreeToTierPanel />
  </SigmaGraph>
</template>

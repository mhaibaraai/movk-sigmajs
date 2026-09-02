<script setup lang="ts">
import type { StylesDeclaration } from 'sigma/types'

const { data } = await useFetch('/api/euroSIS.json', { server: false })

const styles: StylesDeclaration = {
  nodes: {
    color: '#3b82f6',
    size: { attribute: 'nansi-degree', min: 2, max: 12, minValue: 1, maxValue: 125 }
  },
  edges: { color: '#e2e8f0' }
}
</script>

<template>
  <SigmaGraph
    v-if="data"
    :data="data"
    :styles="styles"
    :settings="{ hideEdgesOnMove: true, itemSizesReference: 'screen', renderLabels: false }"
  >
    <UseSigmaLayoutWorkerPanel />
  </SigmaGraph>
</template>

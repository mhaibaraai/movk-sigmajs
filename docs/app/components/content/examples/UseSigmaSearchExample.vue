<script setup lang="ts">
import type { StylesDeclaration } from 'sigma/types'

const { data: dataset } = await useFetch('/api/wikipedia.json', { server: false })

const styles = computed<StylesDeclaration>(() => ({
  nodes: {
    color: { attribute: 'cluster', dict: dataset.value?.clusterColors ?? {}, defaultValue: '#94a3b8' },
    size: {
      attribute: 'score',
      min: 4,
      max: 18,
      minValue: dataset.value?.scoreExtent[0],
      maxValue: dataset.value?.scoreExtent[1]
    }
  },
  edges: { color: '#e2e8f0' }
}))
</script>

<template>
  <SigmaGraph
    v-if="dataset"
    :data="dataset.data"
    :styles="styles"
    :settings="{ hideEdgesOnMove: true }"
  >
    <UseSigmaSearchPanel />
  </SigmaGraph>
</template>

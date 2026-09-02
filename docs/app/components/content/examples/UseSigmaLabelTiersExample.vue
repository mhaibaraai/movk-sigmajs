<script setup lang="ts">
import Graph from 'graphology'
import type { StylesDeclaration } from 'sigma/types'

const props = defineProps<{ breakpoints: string }>()

const { data: dataset } = await useFetch('/api/wikipedia.json', { server: false })

const graph = computed(() => {
  if (!dataset.value) {
    return null
  }

  const instance = new Graph()
  instance.import(dataset.value.data)

  for (const [node, tier] of Object.entries(degreeToTier(instance))) {
    instance.setNodeAttribute(node, 'labelTier', tier)
  }

  return instance
})

const parsed = computed(() =>
  props.breakpoints.split('/').map((ratio, index) => [Number(ratio), index] as const)
)

const styles = computed<StylesDeclaration>(() => ({
  nodes: {
    color: { attribute: 'cluster', dict: dataset.value?.clusterColors ?? {}, defaultValue: '#94a3b8' },
    size: {
      attribute: 'score',
      min: 4,
      max: 18,
      minValue: dataset.value?.scoreExtent[0],
      maxValue: dataset.value?.scoreExtent[1]
    },
    labelSize: { attribute: 'labelTier', dict: { 0: 14, 1: 12, 2: 11 }, defaultValue: 12 },
    labelColor: { attribute: 'labelTier', dict: { 0: '#0f172a', 1: '#1e293b', 2: '#64748b' }, defaultValue: '#1e293b' }
  }
}))
</script>

<template>
  <SigmaGraph
    v-if="graph"
    :graph="graph"
    :styles="styles"
    :settings="{ itemSizesReference: 'screen', hideEdgesOnMove: true, renderEdgeLabels: false }"
  >
    <UseSigmaLabelTiersPanel :key="breakpoints" :breakpoints="parsed" />
  </SigmaGraph>
</template>

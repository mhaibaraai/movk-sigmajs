<script setup lang="ts">
import Graph from 'graphology'
import type { StylesDeclaration } from 'sigma/types'

const { data: dataset } = await useFetch('/api/wikipedia.json', { server: false })

const graph = computed(() => {
  if (!dataset.value) {
    return null
  }

  const instance = new Graph()
  instance.import(dataset.value.data)

  // 档位由 degreeToTier() 按度数排名算出，写进节点属性供 labelTiers 读取
  for (const [node, tier] of Object.entries(degreeToTier(instance))) {
    instance.setNodeAttribute(node, 'labelTier', tier)
  }

  return instance
})

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
    labelSize: { attribute: 'labelTier', dict: { 0: 14, 1: 12, 2: 11 }, defaultValue: 12 }
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
    <UseSigmaLabelTiersPanel />
  </SigmaGraph>
</template>

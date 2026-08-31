<script setup lang="ts">
import type { StylesDeclaration } from 'sigma/types'

const { data: dataset } = await useFetch('/api/wikipedia.json')

const styles = computed<StylesDeclaration>(() => ({
  nodes: {
    label: { attribute: 'label' },
    color: { attribute: 'cluster', dict: dataset.value?.clusterColors ?? {}, defaultValue: '#999' },
    size: {
      attribute: 'score',
      min: 6,
      max: 24,
      minValue: dataset.value?.scoreExtent[0],
      maxValue: dataset.value?.scoreExtent[1]
    }
  },
  edges: { color: '#ddd' }
}))
</script>

<template>
  <SigmaGraph :data="dataset!.data" :styles="styles" :settings="{ enableEdgeEvents: true }">
    <SigmaTooltip target="both">
      <template #default="{ id, type, attributes }">
        <strong>{{ attributes.label ?? id }}</strong>
        <span class="ml-1.5 text-muted">
          {{ type === 'node' ? dataset!.clusterLabels[attributes.cluster] : '关系' }}
        </span>
      </template>
    </SigmaTooltip>
  </SigmaGraph>
</template>

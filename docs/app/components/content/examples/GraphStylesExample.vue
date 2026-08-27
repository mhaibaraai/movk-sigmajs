<script setup lang="ts">
import type { StylesDeclaration } from 'sigma/types'
import type { WikipediaPayload } from '../../../../server/api/wikipedia.json.get'

const { data: dataset } = await useFetch<WikipediaPayload>('/api/wikipedia.json')

const styles = computed<StylesDeclaration>(() => ({
  nodes: {
    label: { attribute: 'label' },
    color: { attribute: 'cluster', dict: dataset.value?.clusterColors ?? {}, defaultValue: '#999' },
    size: {
      attribute: 'score',
      min: 10,
      max: 50,
      minValue: dataset.value?.scoreExtent[0],
      maxValue: dataset.value?.scoreExtent[1]
    }
  },
  edges: { color: '#ccc', size: 5 }
}))
</script>

<template>
  <SigmaGraph :data="dataset!.data" :styles="styles" />
</template>

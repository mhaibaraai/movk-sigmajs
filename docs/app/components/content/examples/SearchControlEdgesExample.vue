<script setup lang="ts">
import type { Settings } from 'sigma/settings'
import type { StylesDeclaration } from 'sigma/types'

defineProps<{ edges: boolean }>()

const { data } = await useFetch('/api/small.json')

const styles: StylesDeclaration = {
  edges: { labelVisibility: 'visible' }
}

const settings: Partial<Settings> = {
  renderLabels: false,
  renderEdgeLabels: true,
  itemSizesReference: 'positions',
  autoRescale: true
}
</script>

<template>
  <SigmaGraph :data="data" :styles="styles" :settings="settings">
    <SigmaControls position="top-right">
      <SigmaSearchControl
        :key="`edges-${edges}`"
        :edges="edges"
        placeholder="试试 B"
      />
    </SigmaControls>
  </SigmaGraph>
</template>

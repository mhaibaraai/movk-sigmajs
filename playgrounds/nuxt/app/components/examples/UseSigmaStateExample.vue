<script setup lang="ts">
import type { SigmaStyles } from '@movk/sigma'

const { data } = await useFetch('/api/small.json')

const customNodeState = { isPinned: false }

const styles: SigmaStyles<typeof customNodeState> = {
  nodes: [
    { whenState: 'isHighlighted', then: { labelVisibility: 'visible' } },
    { whenState: 'isPinned', then: { color: '#0f172b', labelVisibility: 'visible' } }
  ]
}
</script>

<template>
  <SigmaGraph :data="data" :styles="styles" :custom-node-state="customNodeState">
    <UseSigmaStatePanel />
  </SigmaGraph>
</template>

<script setup lang="ts">
import type { SigmaStyles } from '@movk/sigma'

defineProps<{ depth: number }>()

const { data } = await useFetch('/api/data.json')

interface NodeState { reach: string }

const customNodeState: NodeState = { reach: 'out' }

const styles: SigmaStyles<NodeState> = {
  nodes: [{
    matchState: 'reach',
    cases: {
      center: { color: '#f43f5e', zIndex: 2 },
      hit: { color: '#3b82f6', zIndex: 1 },
      out: { color: '#d1d5db', labelVisibility: 'hidden' }
    }
  }]
}
</script>

<template>
  <SigmaGraph :data="data" :styles="styles" :custom-node-state="customNodeState">
    <UseSigmaNeighborhoodPanel :key="depth" :depth="Number(depth)" />
  </SigmaGraph>
</template>

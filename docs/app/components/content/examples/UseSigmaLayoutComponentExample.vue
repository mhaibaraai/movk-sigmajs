<script setup lang="ts">
import type { SerializedGraph } from 'graphology-types'

const PALETTE = ['#f43f5e', '#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#14b8a6']

const data: SerializedGraph = {
  attributes: {},
  options: { type: 'undirected', multi: false, allowSelfLoops: false },
  nodes: PALETTE.flatMap((color, group) =>
    Array.from({ length: 3 + (group % 3) }, (_, index) => {
      const angle = (group * 5 + index) * 1.1
      return {
        key: `g${group}-${index}`,
        attributes: { x: Math.cos(angle) * 120, y: Math.sin(angle) * 120, size: 8, color }
      }
    })
  ),
  edges: PALETTE.flatMap((_, group) =>
    Array.from({ length: 2 + (group % 3) }, (_, index) => ({
      source: `g${group}-0`,
      target: `g${group}-${index + 1}`,
      attributes: {}
    }))
  )
}
</script>

<template>
  <SigmaGraph :data="data" :settings="{ itemSizesReference: 'screen' }">
    <UseSigmaLayoutComponentPanel />
  </SigmaGraph>
</template>

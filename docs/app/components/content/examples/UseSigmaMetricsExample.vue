<script setup lang="ts">
import type { StylesDeclaration } from 'sigma/types'

const { data } = await useFetch('/api/data.json')

const COMMUNITY_COLORS: Record<number, string> = Object.fromEntries(
  ['#f43f5e', '#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#14b8a6'].map((color, index) => [index, color])
)

const styles: StylesDeclaration = {
  nodes: {
    size: attributes => (attributes.metric === undefined
      ? attributes.size as number
      : 4 + (attributes.metric as number) * 22),
    color: attributes => COMMUNITY_COLORS[attributes.community as number] ?? attributes.color as string
  }
}
</script>

<template>
  <SigmaGraph :data="data" :styles="styles">
    <UseSigmaMetricsPanel />
  </SigmaGraph>
</template>

<script setup lang="ts">
import Graph from 'graphology'
import type { StylesDeclaration } from 'sigma/types'

// breakpoints 只在 setup 时读一次，切换时用 key 强制重挂载面板
const props = defineProps<{ breakpoints: string }>()

/**
 * 缩放分级：视野越广，只留下越重要的那几档标签。
 * 档位先由 degreeToTier 写进属性，useSigmaLabelTiers 只决定「当前该显示到哪一档」。
 */
const graph = new Graph()
graph.import(demoGraph({ nodes: 30, extraEdges: 1 }))

const tiers = degreeToTier(graph)
for (const [node, tier] of Object.entries(tiers)) {
  graph.setNodeAttribute(node, 'labelTier', tier)
}

// '2.6/1.3' → [[2.6, 0], [1.3, 1]]
const parsed = computed(() =>
  props.breakpoints.split('/').map((ratio, index) => [Number(ratio), index] as const)
)

const styles: StylesDeclaration = {
  nodes: [demoNodeStyle, {
    labelSize: { attribute: 'labelTier', dict: { 0: 14, 1: 12, 2: 11 }, defaultValue: 12 },
    labelColor: { attribute: 'labelTier', dict: { 0: '#0f172a', 1: '#1e293b', 2: '#64748b' }, defaultValue: '#1e293b' }
  }]
}
</script>

<template>
  <SigmaGraph :graph="graph" :styles="styles" :settings="{ renderEdgeLabels: false }">
    <UseSigmaLabelTiersPanel :key="breakpoints" :breakpoints="parsed" />
  </SigmaGraph>
</template>

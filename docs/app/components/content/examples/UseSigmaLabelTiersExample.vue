<script setup lang="ts">
import Graph from 'graphology'

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

const labels = createLabelRenderer({
  maxChars: 6,
  tiers: {
    0: { size: 14, weight: '600', color: '#0f172a' },
    1: { size: 12, weight: '500', color: '#1e293b' },
    2: { size: 11, weight: '400', color: '#64748b' }
  }
})

const settings = {
  labelSize: 12,
  labelColor: { color: '#1e293b' },
  renderEdgeLabels: false,
  defaultDrawNodeLabel: labels.drawNodeLabel,
  defaultDrawNodeHover: labels.drawNodeHover
}
</script>

<template>
  <SigmaGraph :graph="graph" :settings="settings" @before-render="labels.resetFrame()">
    <UseSigmaLabelTiersPanel />
  </SigmaGraph>
</template>

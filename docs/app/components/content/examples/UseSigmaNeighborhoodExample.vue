<script setup lang="ts">
import type { SigmaStyles } from '@movk/sigma'

const data = demoGraph({ nodes: 24, extraEdges: 1 })

// 自定义状态标志位，键名不能与 BaseNodeState 冲突
interface NodeState { reach: string }

const customNodeState: NodeState = { reach: 'out' }

const styles: SigmaStyles<NodeState> = {
  nodes: [demoNodeStyle, {
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
    <UseSigmaNeighborhoodPanel />
  </SigmaGraph>
</template>

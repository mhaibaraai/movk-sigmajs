<script setup lang="ts">
import type { SerializedGraph } from 'graphology-types'

// 数据形状本身就是演示内容：六个互不相连的小分量，正是全图布局会推散的那种图
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
  <!-- ForceAtlas2 收敛到几十个单位，v4 默认 size 是图坐标单位，不切到 screen 语义节点会铺满画布 -->
  <SigmaGraph :data="data" :settings="{ itemSizesReference: 'screen' }">
    <UseSigmaLayoutComponentPanel />
  </SigmaGraph>
</template>

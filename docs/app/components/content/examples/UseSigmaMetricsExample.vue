<script setup lang="ts">
import type { StylesDeclaration } from 'sigma/types'

const data = demoGraph({ nodes: 30, extraEdges: 1 })

/** 分类配色，社区编号超出长度时由 dict 兜底 */
const COMMUNITY_COLORS = Object.fromEntries(
  ['#f43f5e', '#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#14b8a6'].map((color, index) => [index, color])
)

// 面板只写 metric / community 两个语义属性，换算成尺寸与颜色是 styles 的事
const styles: StylesDeclaration = {
  nodes: [demoNodeStyle, {
    size: { attribute: 'metric', min: 4, max: 26, minValue: 0, maxValue: 1, defaultValue: 8 },
    color: { attribute: 'community', dict: COMMUNITY_COLORS, defaultValue: '#94a3b8' }
  }]
}
</script>

<template>
  <SigmaGraph :data="data" :styles="styles">
    <UseSigmaMetricsPanel />
  </SigmaGraph>
</template>

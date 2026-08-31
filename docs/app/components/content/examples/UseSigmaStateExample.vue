<script setup lang="ts">
import type { SigmaStyles } from '@movk/sigma'

const data = demoGraph({ nodes: 10 })

// 自定义标志位先在根组件声明默认值，styles 与 composable 才认得它
const customNodeState = { isPinned: false }

const styles: SigmaStyles<typeof customNodeState> = {
  nodes: [
    demoNodeStyle,
    { whenState: 'isHighlighted', then: { labelVisibility: 'visible' } },
    { whenState: 'isPinned', then: { color: '#f59e0b', labelVisibility: 'visible' } }
  ]
}
</script>

<template>
  <SigmaGraph :data="data" :styles="styles" :custom-node-state="customNodeState">
    <UseSigmaStatePanel />
  </SigmaGraph>
</template>

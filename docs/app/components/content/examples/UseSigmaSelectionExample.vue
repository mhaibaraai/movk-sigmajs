<script setup lang="ts">
// dim 只在 setup 时读一次，切换时用 key 强制重挂载面板
defineProps<{ dim: boolean }>()

const data = demoGraph({ nodes: 14, extraEdges: 1 })
</script>

<template>
  <SigmaGraph :styles="demoStyles" :data="data">
    <UseSigmaSelectionPanel :key="String(dim)" :dim="dim" />
    <SigmaTooltip />
  </SigmaGraph>
</template>

<script setup lang="ts">
// hideDanglingEdges 只在 setup 时读一次，切换时用 key 强制重挂载面板
defineProps<{ hideDanglingEdges: boolean }>()

const data = demoGraph({ nodes: 18, extraEdges: 1 })
</script>

<template>
  <SigmaGraph :styles="demoStyles" :data="data">
    <UseSigmaFilterDanglingPanel
      :key="String(hideDanglingEdges)"
      :hide-dangling-edges="hideDanglingEdges"
    />
  </SigmaGraph>
</template>

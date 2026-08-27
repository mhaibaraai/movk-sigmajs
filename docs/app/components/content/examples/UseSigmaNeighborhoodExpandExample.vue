<script setup lang="ts">
// 首屏只给概览数据，其余按需拉取
const data = demoGraph({ nodes: 5, extraEdges: 0 })
</script>

<template>
  <SigmaGraph :styles="demoStyles" :data="data">
    <UseSigmaNeighborhoodExpandPanel />
    <SigmaTooltip />
  </SigmaGraph>
</template>

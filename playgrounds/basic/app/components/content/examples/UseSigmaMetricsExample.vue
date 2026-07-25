<script setup lang="ts">
const data = demoGraph({ nodes: 30, extraEdges: 1 })
</script>

<template>
  <SigmaGraph :data="data">
    <UseSigmaMetricsPanel />
  </SigmaGraph>
</template>

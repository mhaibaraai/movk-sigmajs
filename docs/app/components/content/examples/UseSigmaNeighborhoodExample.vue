<script setup lang="ts">
const data = demoGraph({ nodes: 24, extraEdges: 1 })
</script>

<template>
  <SigmaGraph :data="data">
    <UseSigmaNeighborhoodPanel />
  </SigmaGraph>
</template>

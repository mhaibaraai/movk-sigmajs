<script setup lang="ts">
const data = demoGraph({ nodes: 60, extraEdges: 1 })
</script>

<template>
  <SigmaGraph :data="data" :settings="{ hideEdgesOnMove: true }">
    <UseSigmaLayoutWorkerPanel />
  </SigmaGraph>
</template>

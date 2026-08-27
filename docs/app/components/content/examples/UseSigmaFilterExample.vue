<script setup lang="ts">
const data = demoGraph({ nodes: 18, extraEdges: 1 })
</script>

<template>
  <SigmaGraph :styles="demoStyles" :data="data" :settings="{ renderEdgeLabels: true }">
    <UseSigmaFilterPanel />
  </SigmaGraph>
</template>

<script setup lang="ts">
const data = demoGraph({ nodes: 6, extraEdges: 0 })
</script>

<template>
  <SigmaGraph :styles="demoStyles" :data="data">
    <UseSigmaGraphPanel />
  </SigmaGraph>
</template>

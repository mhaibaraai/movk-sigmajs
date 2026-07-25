<script setup lang="ts">
const data = demoGraph({ nodes: 12, extraEdges: 1 })
</script>

<template>
  <SigmaGraph :data="data">
    <UseSigmaDragPanel />
  </SigmaGraph>
</template>

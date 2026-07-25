<script setup lang="ts">
const data = demoGraph({ nodes: 40, extraEdges: 1 })
</script>

<template>
  <SigmaGraph :data="data">
    <UseSigmaLayoutPanel />
  </SigmaGraph>
</template>

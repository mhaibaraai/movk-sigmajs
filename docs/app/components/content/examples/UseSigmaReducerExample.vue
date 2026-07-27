<script setup lang="ts">
const data = demoGraph({ nodes: 16, extraEdges: 1 })
</script>

<template>
  <SigmaGraph :data="data">
    <UseSigmaReducerPanel />
  </SigmaGraph>
</template>

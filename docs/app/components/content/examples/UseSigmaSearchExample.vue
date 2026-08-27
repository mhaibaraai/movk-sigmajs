<script setup lang="ts">
const data = demoGraph({ nodes: 16, extraEdges: 1 })
</script>

<template>
  <SigmaGraph :styles="demoStyles" :data="data">
    <UseSigmaSearchPanel />
  </SigmaGraph>
</template>

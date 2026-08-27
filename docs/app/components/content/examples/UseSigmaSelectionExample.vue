<script setup lang="ts">
const data = demoGraph({ nodes: 14, extraEdges: 1 })
</script>

<template>
  <SigmaGraph :styles="demoStyles" :data="data">
    <UseSigmaSelectionPanel />
    <SigmaTooltip />
  </SigmaGraph>
</template>

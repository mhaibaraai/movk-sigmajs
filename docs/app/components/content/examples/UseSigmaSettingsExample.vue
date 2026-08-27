<script setup lang="ts">
const data = demoGraph({ nodes: 12, extraEdges: 1 })
</script>

<template>
  <SigmaGraph :styles="demoStyles" :data="data">
    <UseSigmaSettingsPanel />
  </SigmaGraph>
</template>

<script setup lang="ts">
const data = demoGraph({ nodes: 7 })
</script>

<template>
  <SigmaGraph :styles="demoStyles" :data="data">
    <UseSigmaEventsPanel />
  </SigmaGraph>
</template>

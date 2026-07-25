<script setup lang="ts">
const data = demoGraph({ nodes: 7 })
</script>

<template>
  <SigmaGraph :data="data">
    <UseSigmaEventsPanel />
  </SigmaGraph>
</template>

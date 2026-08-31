<script setup lang="ts">
defineProps<{ backgroundColor: string, sigmaOverrides: boolean }>()

const data = demoGraph({ nodes: 16, extraEdges: 1 })
</script>

<template>
  <SigmaGraph :styles="demoStyles" :data="data">
    <UseSigmaExportOverridesPanel
      :background-color="backgroundColor"
      :sigma-overrides="sigmaOverrides"
    />
  </SigmaGraph>
</template>

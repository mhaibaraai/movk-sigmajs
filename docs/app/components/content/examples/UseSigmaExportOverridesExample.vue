<script setup lang="ts">
defineProps<{ backgroundColor: string, sigmaOverrides: boolean }>()

const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data">
    <UseSigmaExportOverridesPanel
      :background-color="backgroundColor"
      :sigma-overrides="sigmaOverrides"
    />
  </SigmaGraph>
</template>

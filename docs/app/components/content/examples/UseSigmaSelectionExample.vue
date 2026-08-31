<script setup lang="ts">
defineProps<{ dim: boolean }>()

const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data">
    <UseSigmaSelectionPanel :key="String(dim)" :dim="dim" />
    <SigmaTooltip />
  </SigmaGraph>
</template>

<script setup lang="ts">
defineProps<{ field: string, colorField: string, fallback: string }>()

const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaLegend :field="field" :color-field="colorField" :fallback="fallback" />
    </SigmaControls>
  </SigmaGraph>
</template>

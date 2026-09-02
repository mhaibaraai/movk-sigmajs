<script setup lang="ts">
const legend = useTemplateRef('legend')

const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaLegend ref="legend" field="category" color-field="categoryColor" />
    </SigmaControls>

    <SigmaControls position="bottom-left">
      <UButton size="xs" color="neutral" label="reset()" @click="legend?.reset()" />
    </SigmaControls>
  </SigmaGraph>
</template>

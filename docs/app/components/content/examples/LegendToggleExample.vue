<script setup lang="ts">
defineProps<{ toggleable: boolean }>()

const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaLegend field="category" color-field="categoryColor" :toggleable="toggleable" />
    </SigmaControls>
  </SigmaGraph>
</template>

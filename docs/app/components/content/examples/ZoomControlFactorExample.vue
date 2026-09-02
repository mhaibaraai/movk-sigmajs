<script setup lang="ts">
defineProps<{ factor?: number }>()

const { data } = await useFetch('/api/small.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaZoomControl :factor="Number(factor)" />
    </SigmaControls>
  </SigmaGraph>
</template>

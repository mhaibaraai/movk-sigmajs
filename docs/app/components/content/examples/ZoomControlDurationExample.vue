<script setup lang="ts">
defineProps<{ duration?: number }>()

const { data } = await useFetch('/api/small.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaZoomControl :duration="Number(duration)" />
    </SigmaControls>
  </SigmaGraph>
</template>

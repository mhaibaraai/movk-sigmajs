<script setup lang="ts">
defineProps<{
  direction?: 'vertical' | 'vertical-reverse' | 'horizontal' | 'horizontal-reverse'
}>()

const { data } = await useFetch('/api/small.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right" :direction="direction">
      <SigmaZoomControl />
      <SigmaFullscreenControl />
    </SigmaControls>
  </SigmaGraph>
</template>

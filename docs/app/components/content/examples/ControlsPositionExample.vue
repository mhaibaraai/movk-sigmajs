<script setup lang="ts">
defineProps<{
  position?:
    | 'top-left' | 'top-center' | 'top-right'
    | 'middle-left' | 'middle-right'
    | 'bottom-left' | 'bottom-center' | 'bottom-right'
}>()

const { data } = await useFetch('/api/small.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls :position="position">
      <SigmaZoomControl />
    </SigmaControls>
  </SigmaGraph>
</template>

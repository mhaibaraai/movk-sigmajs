<script setup lang="ts">
// factor 只作用于放大与缩小，复位调的是相机 reset()，只吃 duration
withDefaults(defineProps<{ factor?: number, duration?: number }>(), {
  factor: 1.5,
  duration: 200
})

const { data } = await useFetch('/api/small.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaZoomControl :factor="Number(factor)" :duration="Number(duration)" />
    </SigmaControls>
  </SigmaGraph>
</template>

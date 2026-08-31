<script setup lang="ts">
// labels 三项依次对应放大、缩小、复位，同时用作 aria-label 与 title
withDefaults(defineProps<{ reset?: boolean }>(), { reset: true })

const { data } = await useFetch('/api/small.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaZoomControl
        :reset="reset"
        :labels="['放大一档', '缩小一档', '回到初始视角']"
      />
    </SigmaControls>
  </SigmaGraph>
</template>

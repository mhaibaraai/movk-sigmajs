<script setup lang="ts">
// 点击只调 animate({ x, y })，不动 ratio：缩放级别归 SigmaZoomControl 管
withDefaults(defineProps<{ clickToMove?: boolean, duration?: number }>(), {
  clickToMove: true,
  duration: 300
})

const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="bottom-left">
      <SigmaMiniMap :click-to-move="clickToMove" :duration="Number(duration)" />
    </SigmaControls>

    <SigmaControls position="top-right">
      <SigmaZoomControl />
    </SigmaControls>
  </SigmaGraph>
</template>

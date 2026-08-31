<script setup lang="ts">
defineProps<{ clickToMove: boolean, duration: number }>()

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

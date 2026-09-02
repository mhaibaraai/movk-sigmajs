<script setup lang="ts">
defineProps<{ enterLabel: string, exitLabel: string }>()

const { data } = await useFetch('/api/small.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaFullscreenControl :labels="[enterLabel, exitLabel]" />
      <SigmaZoomControl :reset="false" />
    </SigmaControls>

    <SigmaTooltip />
  </SigmaGraph>
</template>

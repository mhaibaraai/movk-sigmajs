<script setup lang="ts">
defineProps<{ reset?: boolean }>()

const { data } = await useFetch('/api/small.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaZoomControl :reset="reset" />
    </SigmaControls>
  </SigmaGraph>
</template>

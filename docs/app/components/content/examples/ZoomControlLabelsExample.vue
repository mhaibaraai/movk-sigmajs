<script setup lang="ts">
defineProps<{ labels?: [string, string, string] }>()

const { data } = await useFetch('/api/small.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaZoomControl :labels="labels" />
    </SigmaControls>
  </SigmaGraph>
</template>

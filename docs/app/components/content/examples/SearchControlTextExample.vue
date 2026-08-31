<script setup lang="ts">
defineProps<{ placeholder: string }>()

const { data } = await useFetch('/api/small.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaSearchControl :placeholder="placeholder" />
    </SigmaControls>
  </SigmaGraph>
</template>

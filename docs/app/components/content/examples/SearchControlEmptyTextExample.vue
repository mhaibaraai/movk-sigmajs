<script setup lang="ts">
defineProps<{ emptyText: string }>()

const { data } = await useFetch('/api/small.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaSearchControl :empty-text="emptyText" />
    </SigmaControls>
  </SigmaGraph>
</template>

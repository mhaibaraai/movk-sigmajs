<script setup lang="ts">
defineProps<{ trigger?: 'hover' | 'click' }>()

const { data } = await useFetch('/api/small.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaTooltip :trigger="trigger" />
  </SigmaGraph>
</template>

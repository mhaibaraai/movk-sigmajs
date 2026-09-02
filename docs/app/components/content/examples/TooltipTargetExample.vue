<script setup lang="ts">
defineProps<{ target?: 'node' | 'edge' | 'both' }>()

const { data } = await useFetch('/api/small.json')
</script>

<template>
  <SigmaGraph :data="data" :settings="{ enableEdgeEvents: true }">
    <SigmaTooltip :target="target" />
  </SigmaGraph>
</template>

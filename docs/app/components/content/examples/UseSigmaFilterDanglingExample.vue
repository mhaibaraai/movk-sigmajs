<script setup lang="ts">
defineProps<{ hideDanglingEdges: boolean }>()

const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data">
    <UseSigmaFilterDanglingPanel
      :key="String(hideDanglingEdges)"
      :hide-dangling-edges="hideDanglingEdges"
    />
  </SigmaGraph>
</template>

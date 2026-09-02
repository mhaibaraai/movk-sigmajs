<script setup lang="ts">
defineProps<{ nodeRadius: number, padding: number }>()

const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="bottom-left">
      <SigmaMiniMap :node-radius="Number(nodeRadius)" :padding="Number(padding)" />
    </SigmaControls>

    <SigmaControls position="top-right">
      <SigmaZoomControl />
    </SigmaControls>
  </SigmaGraph>
</template>

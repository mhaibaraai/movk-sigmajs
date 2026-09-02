<script setup lang="ts">
const { data } = await useFetch('/api/data.json')

const style = {
  '--sigma-minimap-size': '180px',
  '--sigma-minimap-node': '#94a3b8',
  '--sigma-minimap-viewport': '#e11d48'
}
</script>

<template>
  <SigmaGraph :data="data" :style="style">
    <SigmaControls position="bottom-left">
      <SigmaMiniMap />
    </SigmaControls>

    <SigmaControls position="top-right">
      <SigmaZoomControl />
    </SigmaControls>
  </SigmaGraph>
</template>

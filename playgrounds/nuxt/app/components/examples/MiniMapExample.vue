<script setup lang="ts">
const { data } = await useFetch('/api/euroSIS.json')

const style = {
  '--sigma-minimap-size': '180px',
  '--sigma-minimap-node': '#94a3b8',
  '--sigma-minimap-viewport': '#e11d48'
}
</script>

<template>
  <SigmaGraph :data="data" :style="style" :settings="{ hideEdgesOnMove: true }">
    <SigmaControls position="bottom-left">
      <SigmaMiniMap :node-radius="1.5" :padding="12" />
    </SigmaControls>

    <SigmaControls position="top-right">
      <SigmaZoomControl />
    </SigmaControls>
  </SigmaGraph>
</template>

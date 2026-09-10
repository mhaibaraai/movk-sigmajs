<script setup lang="ts">
const { data } = await useFetch('/api/small.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaFullscreenControl :labels="['进入全屏', '退出全屏']" />
      <SigmaZoomControl :reset="false" />
    </SigmaControls>

    <SigmaTooltip />
  </SigmaGraph>
</template>

<script setup lang="ts">
// 三个具名插槽只负责图标，点击行为、type、aria-label、title 仍由库提供
const { data } = await useFetch('/api/small.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaZoomControl :labels="['放大', '缩小', '回到全图']">
        <template #zoom-in>
          <UIcon name="i-lucide-plus" />
        </template>
        <template #zoom-out>
          <UIcon name="i-lucide-minus" />
        </template>
        <template #reset>
          <UIcon name="i-lucide-locate-fixed" />
        </template>
      </SigmaZoomControl>
    </SigmaControls>
  </SigmaGraph>
</template>

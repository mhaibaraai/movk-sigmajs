<script setup lang="ts">
const { data } = await useFetch('/api/small.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaZoomControl :labels="['放大', '缩小', '回到全图']">
        <template #zoom-in>
          <UIcon name="i-lucide-zoom-in" />
        </template>
        <template #zoom-out>
          <UIcon name="i-lucide-zoom-out" />
        </template>
        <template #reset>
          <UIcon name="i-lucide-square-mouse-pointer" />
        </template>
      </SigmaZoomControl>
    </SigmaControls>
  </SigmaGraph>
</template>

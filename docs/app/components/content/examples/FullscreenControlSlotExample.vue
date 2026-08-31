<script setup lang="ts">
// 默认插槽以 { isFullscreen } 暴露当前状态，供图标随状态切换
const { data } = await useFetch('/api/small.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaFullscreenControl>
        <template #default="{ isFullscreen }">
          <UIcon :name="isFullscreen ? 'i-lucide-minimize' : 'i-lucide-maximize'" />
        </template>
      </SigmaFullscreenControl>
    </SigmaControls>
  </SigmaGraph>
</template>

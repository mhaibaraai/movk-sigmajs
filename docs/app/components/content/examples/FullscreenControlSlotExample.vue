<script setup lang="ts">
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

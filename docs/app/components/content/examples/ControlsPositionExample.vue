<script setup lang="ts">
// 八个停靠位：四角加四条边的中点，语序固定为「纵向-横向」
withDefaults(defineProps<{
  position?:
    | 'top-left' | 'top-center' | 'top-right'
    | 'middle-left' | 'middle-right'
    | 'bottom-left' | 'bottom-center' | 'bottom-right'
}>(), { position: 'top-left' })

const { data } = await useFetch('/api/small.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls :position="position">
      <SigmaZoomControl />
      <UBadge color="neutral" variant="subtle" :label="position" />
    </SigmaControls>
  </SigmaGraph>
</template>

<script setup lang="ts">
// reverse 变体经 flex-direction: inherit 一路下钻，缩放按钮的顺序也跟着翻转
withDefaults(defineProps<{
  direction?: 'vertical' | 'vertical-reverse' | 'horizontal' | 'horizontal-reverse'
}>(), { direction: 'vertical' })

const { data } = await useFetch('/api/small.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-center" :direction="direction">
      <SigmaZoomControl />
      <SigmaFullscreenControl />
    </SigmaControls>
  </SigmaGraph>
</template>

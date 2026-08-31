<script setup lang="ts">
// 全屏目标是整个 .sigma-root，覆盖层与其他控件一并跟随
withDefaults(defineProps<{ enterLabel?: string, exitLabel?: string }>(), {
  enterLabel: '进入全屏',
  exitLabel: '退出全屏'
})

const { data } = await useFetch('/api/small.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaFullscreenControl :labels="[enterLabel, exitLabel]" />
      <SigmaZoomControl :reset="false" />
    </SigmaControls>

    <SigmaTooltip />
  </SigmaGraph>
</template>

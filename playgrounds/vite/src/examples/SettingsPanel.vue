<script setup lang="ts">
import { computed } from 'vue'

const { sigma } = useSigma()

const settings = computed(() => {
  const current = sigma.value?.getSettings()
  return {
    // 组件级传入，应为 1
    labelDensity: current?.labelDensity,
    // 只在全局默认里给过，应为 true
    renderEdgeLabels: current?.renderEdgeLabels
  }
})
</script>

<template>
  <div class="panel">
    <span>labelDensity: <code>{{ settings.labelDensity }}</code></span>
    <span>renderEdgeLabels: <code>{{ settings.renderEdgeLabels }}</code></span>
  </div>
</template>

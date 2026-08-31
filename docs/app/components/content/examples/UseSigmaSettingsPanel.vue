<script setup lang="ts">
import { computed, shallowRef } from 'vue'

// 响应式 settings：源变化即 setSettings，无需手动调用
const labels = shallowRef(true)
const edgeLabels = shallowRef(false)
const density = shallowRef(1)

useSigmaSettings(computed(() => ({
  renderLabels: labels.value,
  renderEdgeLabels: edgeLabels.value,
  labelDensity: density.value,
  labelRenderedSizeThreshold: 0
})))
</script>

<template>
  <SigmaControls>
    <div class="bg-accented p-2 flex flex-col gap-2 w-48">
      <USwitch v-model="labels" size="xs" label="节点标签" />
      <USwitch v-model="edgeLabels" size="xs" label="边标签" />
      <USlider v-model="density" size="xs" :min="0.1" :max="3" :step="0.1" />
      <span class="text-muted text-xs">labelDensity {{ density }}</span>
    </div>
  </SigmaControls>
</template>

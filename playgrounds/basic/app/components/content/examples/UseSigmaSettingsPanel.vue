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
  <div class="demo-panel" data-at="top-left">
    <div class="demo-row">
      <button type="button" :aria-pressed="labels" @click="labels = !labels">
        节点标签
      </button>
      <button type="button" :aria-pressed="edgeLabels" @click="edgeLabels = !edgeLabels">
        边标签
      </button>
    </div>
    <div class="demo-row">
      <span class="demo-label">密度</span>
      <input v-model.number="density" type="range" min="0.1" max="3" step="0.1">
      <span class="demo-tag">{{ density }}</span>
    </div>
  </div>
</template>

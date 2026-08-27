<script setup lang="ts">
import { shallowRef } from 'vue'
import type Sigma from 'sigma'

const settings = {
  renderEdgeLabels: true,
  labelRenderedSizeThreshold: 0,
  futureUnknownSetting: '库不认识的键'
}

const readBack = shallowRef('')

function onReady(instance: Sigma) {
  const all = instance.getSettings() as unknown as Record<string, unknown>
  readBack.value = String(all.futureUnknownSetting)
}

const data = {
  attributes: {},
  options: { type: 'mixed' as const, multi: false, allowSelfLoops: true },
  nodes: [
    { key: 'a', attributes: { label: '节点 A', x: 0, y: 0, size: 14, color: '#f43f5e' } },
    { key: 'b', attributes: { label: '节点 B', x: 340, y: 300, size: 12, color: '#3b82f6' } }
  ],
  edges: [{ source: 'a', target: 'b', attributes: { label: '关联' } }]
}
</script>

<template>
  <SigmaGraph :data="data" :settings="settings" @ready="onReady">
    <SigmaControls>
      <UCard>
        {{ readBack }}
      </UCard>
    </SigmaControls>
  </SigmaGraph>
</template>

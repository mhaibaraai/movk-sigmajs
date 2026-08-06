<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import type { SerializedGraph } from 'graphology-types'

// 决定节点视觉大小的是 size 与坐标跨度的比值，不是 size 的绝对值。
// 缩小坐标即等比放大节点——除非切到 screen 语义，那时 size 才是屏幕像素
const reference = shallowRef<'positions' | 'screen'>('positions')
const spread = shallowRef(1)

const base = [
  { key: 'a', label: '制度 A', x: 0, y: 0, size: 14, color: '#f43f5e' },
  { key: 'b', label: '制度 B', x: 320, y: 140, size: 12, color: '#3b82f6' },
  { key: 'c', label: '制度 C', x: 160, y: -220, size: 10, color: '#22c55e' }
]

const data = computed<SerializedGraph>(() => ({
  attributes: {},
  options: { type: 'mixed', multi: false, allowSelfLoops: true },
  nodes: base.map(({ key, label, x, y, size, color }) => ({
    key,
    attributes: { label, x: x * spread.value, y: y * spread.value, size, color }
  })),
  edges: [
    { source: 'a', target: 'b' },
    { source: 'a', target: 'c' }
  ]
}))

const span = computed(() => Math.round(360 * spread.value))
</script>

<template>
  <SigmaGraph :data="data" :settings="{ itemSizesReference: reference }">
    <div class="demo-panel" data-at="top-left">
      <div class="demo-row">
        <span class="demo-label">itemSizesReference</span>
        <button type="button" :aria-pressed="reference === 'positions'" @click="reference = 'positions'">
          positions
        </button>
        <button type="button" :aria-pressed="reference === 'screen'" @click="reference = 'screen'">
          screen
        </button>
      </div>
      <div class="demo-row">
        <span class="demo-label">坐标跨度</span>
        <button type="button" :aria-pressed="spread === 1" @click="spread = 1">
          360 单位
        </button>
        <button type="button" :aria-pressed="spread === 0.05" @click="spread = 0.05">
          18 单位
        </button>
      </div>
      <span class="demo-tag">跨度 {{ span }} 单位 · size 保持 14 / 12 / 10</span>
      <span class="demo-tag">positions 下缩小跨度节点即爆炸，screen 下毫无变化</span>
    </div>
  </SigmaGraph>
</template>

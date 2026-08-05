<script setup lang="ts">
// 放大 / 缩小 / 复位。三个图标各有具名插槽，外观可全接管而行为与无障碍结构由库提供
const data = {
  attributes: {},
  options: { type: 'mixed' as const, multi: false, allowSelfLoops: true },
  nodes: [
    { key: 'a', attributes: { label: '节点 A', x: 0, y: 0, size: 14, color: '#f43f5e' } },
    { key: 'b', attributes: { label: '节点 B', x: 320, y: 140, size: 12, color: '#3b82f6' } },
    { key: 'c', attributes: { label: '节点 C', x: 160, y: -220, size: 12, color: '#22c55e' } }
  ],
  edges: [
    { source: 'a', target: 'b' },
    { source: 'a', target: 'c' }
  ]
}
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaZoomControl />
    </SigmaControls>

    <SigmaControls position="bottom-right">
      <SigmaZoomControl :factor="2" :duration="500">
        <template #zoom-in>
          ＋
        </template>
        <template #zoom-out>
          －
        </template>
        <template #reset>
          ⟲
        </template>
      </SigmaZoomControl>
    </SigmaControls>

    <div class="demo-panel" data-at="top-left">
      <span class="demo-tag">右上是原样外观，右下换了图标并把缩放倍数调到 2</span>
    </div>
  </SigmaGraph>
</template>

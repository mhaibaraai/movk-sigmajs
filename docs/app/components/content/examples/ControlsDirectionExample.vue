<script setup lang="ts">
// 四种排布方向：reverse 变体连同控件组内部一起翻转，缩放按钮的上下顺序会跟着反过来
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
    <SigmaControls position="top-left" direction="vertical">
      <SigmaZoomControl :reset="false" />
      <SigmaFullscreenControl />
    </SigmaControls>

    <SigmaControls position="top-right" direction="vertical-reverse">
      <SigmaZoomControl :reset="false" />
      <SigmaFullscreenControl />
    </SigmaControls>

    <SigmaControls position="bottom-left" direction="horizontal">
      <SigmaZoomControl :reset="false" />
      <SigmaFullscreenControl />
    </SigmaControls>

    <SigmaControls position="bottom-right" direction="horizontal-reverse">
      <SigmaZoomControl :reset="false" />
      <SigmaFullscreenControl />
    </SigmaControls>
  </SigmaGraph>
</template>

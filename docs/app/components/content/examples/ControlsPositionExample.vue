<script setup lang="ts">
// 控件容器负责四角停靠与排布方向，停靠信息落到 data-position / data-direction 上由 CSS 消费。
// 插槽内容走正常文档流，容器替使用方做了绝对定位这件事
const data = {
  attributes: {},
  options: { type: 'mixed' as const, multi: false, allowSelfLoops: true },
  nodes: [
    { key: 'a', attributes: { label: '节点 A', x: 0, y: 0, size: 14, color: '#f43f5e' } },
    { key: 'b', attributes: { label: '节点 B', x: 14, y: 6, size: 12, color: '#3b82f6' } },
    { key: 'c', attributes: { label: '节点 C', x: 7, y: -9, size: 12, color: '#22c55e' } }
  ],
  edges: [
    { source: 'a', target: 'b' },
    { source: 'a', target: 'c' }
  ]
}
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-left" direction="horizontal">
      <SigmaZoomControl :reset="false" />
    </SigmaControls>

    <SigmaControls position="top-right">
      <SigmaZoomControl />
    </SigmaControls>

    <SigmaControls position="bottom-left" direction="horizontal">
      <SigmaFullscreenControl />
    </SigmaControls>

    <SigmaControls position="bottom-right">
      <SigmaFullscreenControl />
    </SigmaControls>
  </SigmaGraph>
</template>

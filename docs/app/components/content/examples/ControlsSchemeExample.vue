<script setup lang="ts">
/**
 * 深色模式的第二条通道：单个实例上的 data-sigma-scheme。
 *
 * $attrs 绑在 .sigma-root 上，样式表的选择器正是
 * `:where(.sigma-root[data-sigma-scheme="dark"])`，因此可以只让某一张图走深色，
 * 而不影响页面其余部分。
 */
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
  <SigmaGraph :data="data" data-sigma-scheme="dark">
    <SigmaControls position="top-right">
      <SigmaSearchControl />
      <SigmaZoomControl />
    </SigmaControls>

    <SigmaControls position="bottom-left">
      <SigmaMiniMap />
    </SigmaControls>

    <SigmaTooltip />
  </SigmaGraph>
</template>

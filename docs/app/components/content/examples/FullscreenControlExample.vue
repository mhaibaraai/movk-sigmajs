<script setup lang="ts">
// 全屏目标取 closest('.sigma-root')，覆盖层与其他控件会一起进入，
// 且不依赖根组件的 DOM 结构。浏览器不支持时控件自身不渲染
const data = {
  attributes: {},
  options: { type: 'mixed' as const, multi: false, allowSelfLoops: true },
  nodes: [
    { key: 'a', attributes: { label: '节点 A', x: 0, y: 0, size: 14, color: '#f43f5e' } },
    { key: 'b', attributes: { label: '节点 B', x: 340, y: 300, size: 12, color: '#3b82f6' } }
  ],
  edges: [{ source: 'a', target: 'b' }]
}
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaFullscreenControl />
      <SigmaZoomControl />
    </SigmaControls>

    <SigmaTooltip />

    <div class="demo-panel" data-at="top-left">
      <span class="demo-tag">进入全屏后控件与提示层一并跟随，悬浮节点可验证</span>
    </div>
  </SigmaGraph>
</template>

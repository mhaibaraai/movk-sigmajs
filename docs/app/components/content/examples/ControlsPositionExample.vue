<script setup lang="ts">
// 八个停靠位：四角加四条边的中点，语序固定为「纵向-横向」
// 停靠信息落到 data-position 上由 CSS 消费，插槽内容走正常文档流
const positions = [
  'top-left', 'top-center', 'top-right',
  'middle-left', 'middle-right',
  'bottom-left', 'bottom-center', 'bottom-right'
] as const

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
    <SigmaControls v-for="position in positions" :key="position" :position="position">
      <div class="sigma-control-group" style="padding: 4px 8px">
        {{ position }}
      </div>
    </SigmaControls>
  </SigmaGraph>
</template>

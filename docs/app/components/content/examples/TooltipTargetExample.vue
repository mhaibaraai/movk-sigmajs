<script setup lang="ts">
// 边没有单一锚点，组件退化到 graph.source(edge) 定位，
// 提示层贴在边的源节点上而不是鼠标位置
withDefaults(defineProps<{ target?: 'node' | 'edge' | 'both' }>(), { target: 'node' })

const data = {
  attributes: {},
  options: { type: 'mixed' as const, multi: false, allowSelfLoops: true },
  nodes: [
    { key: 'a', attributes: { label: '制度 A', x: 0, y: 0, size: 14, color: '#f43f5e' } },
    { key: 'b', attributes: { label: '制度 B', x: 320, y: 140, size: 12, color: '#3b82f6' } },
    { key: 'c', attributes: { label: '制度 C', x: 160, y: -220, size: 12, color: '#22c55e' } }
  ],
  edges: [
    { source: 'a', target: 'b', attributes: { label: '引用' } },
    { source: 'a', target: 'c', attributes: { label: '替代' } }
  ]
}
</script>

<template>
  <SigmaGraph :data="data" :settings="{ enableEdgeEvents: true }">
    <SigmaTooltip :target="target" />

    <SigmaControls>
      <div class="bg-accented p-2 text-muted text-xs">
        两条边都从制度 A 出发，悬浮任意一条，提示层都停在 A 上
      </div>
    </SigmaControls>
  </SigmaGraph>
</template>

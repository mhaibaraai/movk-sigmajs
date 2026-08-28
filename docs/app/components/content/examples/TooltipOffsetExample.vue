<script setup lang="ts">
// .sigma-tooltip 自带 translate: -50% -100% 负责版式，offset 在其上再推像素，
// 通常用来让开节点半径：节点越大，需要的负向 y 越多
const props = withDefaults(defineProps<{ offsetY?: number | string }>(), { offsetY: -12 })

const offset = computed<[number, number]>(() => [0, Number(props.offsetY)])

const data = {
  attributes: {},
  options: { type: 'mixed' as const, multi: false, allowSelfLoops: true },
  nodes: [
    { key: 'a', attributes: { label: '大节点', x: 0, y: 0, size: 28, color: '#f43f5e' } },
    { key: 'b', attributes: { label: '小节点', x: 320, y: 140, size: 8, color: '#3b82f6' } },
    { key: 'c', attributes: { label: '中节点', x: 160, y: -220, size: 16, color: '#22c55e' } }
  ],
  edges: [
    { source: 'a', target: 'b' },
    { source: 'a', target: 'c' }
  ]
}
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaTooltip :offset="offset" />

    <SigmaControls>
      <div class="bg-accented p-2 text-muted text-xs">
        默认 -12 适配中等尺寸；悬浮大节点时提示层会压在圆上，把 offset y 调到 -32 就让开了
      </div>
    </SigmaControls>
  </SigmaGraph>
</template>

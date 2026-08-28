<script setup lang="ts">
// .sigma-popover 自带 translate: -50% -100%，offset 只负责让开节点半径
const props = withDefaults(defineProps<{ offsetY?: number | string }>(), { offsetY: -16 })

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
    <SigmaPopover node="a" :offset="offset">
      <template #default="{ attributes }">
        <strong>{{ attributes.label }}</strong>
      </template>
    </SigmaPopover>

    <SigmaControls>
      <div class="bg-accented p-2 text-muted text-xs">
        offset y = {{ offset[1] }} · 锚定在半径 28 的大节点上，默认 -16 还压着圆，-40 才让开
      </div>
    </SigmaControls>
  </SigmaGraph>
</template>

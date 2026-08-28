<script setup lang="ts">
// offset 只做像素微调，版式（居中、上移）由内容自己的 CSS translate 决定，
// 两者叠加：下面两个覆盖层锚点与 offset 完全相同，差别只在有没有 translate
const props = withDefaults(defineProps<{
  offsetX?: number | string
  offsetY?: number | string
}>(), {
  offsetX: 0,
  offsetY: -24
})

const offset = computed<[number, number]>(() => [Number(props.offsetX), Number(props.offsetY)])

const data = {
  attributes: {},
  options: { type: 'mixed' as const, multi: false, allowSelfLoops: true },
  nodes: [
    { key: 'a', attributes: { label: '节点 A', x: 0, y: 0, size: 16, color: '#f43f5e' } },
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
    <SigmaOverlay node="a" :offset="offset">
      <div class="mark mark-raw">
        左上角落在锚点上
      </div>
    </SigmaOverlay>

    <SigmaOverlay node="a" :offset="offset">
      <div class="mark mark-translated">
        translate: -50% -100%
      </div>
    </SigmaOverlay>

    <SigmaControls>
      <div class="bg-accented p-2 text-muted text-xs">
        offset [{{ offset[0] }}, {{ offset[1] }}] 同时作用于两者，版式差异全部来自 CSS
      </div>
    </SigmaControls>
  </SigmaGraph>
</template>

<style scoped>
.mark {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
}

.mark-raw {
  background: #f59e0b;
  color: #1f2328;
}

.mark-translated {
  translate: -50% -100%;
  background: #0ea5e9;
  color: #fff;
}
</style>

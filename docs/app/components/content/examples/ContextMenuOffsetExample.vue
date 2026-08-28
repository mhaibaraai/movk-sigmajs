<script setup lang="ts">
// 菜单没有 CSS translate，左上角就落在光标上，offset 只是留出一点间隙
const props = withDefaults(defineProps<{
  offsetX?: number | string
  offsetY?: number | string
}>(), {
  offsetX: 4,
  offsetY: 4
})

const offset = computed<[number, number]>(() => [Number(props.offsetX), Number(props.offsetY)])

const data = {
  attributes: {},
  options: { type: 'mixed' as const, multi: false, allowSelfLoops: true },
  nodes: [
    { key: 'a', attributes: { label: '制度 A', x: 0, y: 0, size: 14, color: '#f43f5e' } },
    { key: 'b', attributes: { label: '制度 B', x: 340, y: 300, size: 12, color: '#3b82f6' } }
  ],
  edges: [{ source: 'a', target: 'b' }]
}
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaContextMenu :offset="offset">
      <template #default="{ id }">
        <span class="item">{{ id }} 的菜单</span>
      </template>
    </SigmaContextMenu>

    <SigmaControls>
      <div class="bg-accented p-2 text-muted text-xs">
        offset [{{ offset[0] }}, {{ offset[1] }}] · 在节点上右键，菜单从锚点右下方展开
      </div>
    </SigmaControls>
  </SigmaGraph>
</template>

<style scoped>
.item {
  font-size: 12px;
}
</style>

<script setup lang="ts">
// 插槽以 { id, type, attributes } 暴露命中项。键名用 id 而非 key，
// 后者是 Vue 的保留属性，放不进作用域
const data = {
  attributes: {},
  options: { type: 'mixed' as const, multi: false, allowSelfLoops: true },
  nodes: [
    { key: 'a', attributes: { label: '制度 A', category: '管理制度', x: 0, y: 0, size: 14, color: '#f43f5e' } },
    { key: 'b', attributes: { label: '制度 B', category: '技术标准', x: 320, y: 140, size: 12, color: '#3b82f6' } },
    { key: 'c', attributes: { label: '制度 C', category: '操作规程', x: 160, y: -220, size: 12, color: '#22c55e' } }
  ],
  edges: [
    { source: 'a', target: 'b', attributes: { label: '引用' } },
    { source: 'a', target: 'c', attributes: { label: '替代' } }
  ]
}
</script>

<template>
  <SigmaGraph :data="data" :settings="{ enableEdgeEvents: true }">
    <SigmaTooltip target="both">
      <template #default="{ id, type, attributes }">
        <strong>{{ attributes.label ?? id }}</strong>
        <span class="kind">{{ type === 'node' ? attributes.category : '关系' }}</span>
      </template>
    </SigmaTooltip>

    <SigmaControls>
      <div class="bg-accented p-2 text-muted text-xs">
        节点显示所属分类，边显示「关系」，同一套插槽按 type 分支
      </div>
    </SigmaControls>
  </SigmaGraph>
</template>

<style scoped>
.kind {
  margin-left: 6px;
  opacity: 0.6;
}
</style>

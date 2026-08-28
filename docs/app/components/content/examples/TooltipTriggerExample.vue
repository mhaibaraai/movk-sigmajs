<script setup lang="ts">
import { shallowRef } from 'vue'

const trigger = shallowRef<'hover' | 'click'>('hover')
const target = shallowRef<'node' | 'edge' | 'both'>('node')

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
    <!-- 插槽以 { type, id, attributes } 暴露命中项。键名用 id 而非 key，后者是 Vue 的保留属性 -->
    <SigmaTooltip :trigger="trigger" :target="target">
      <template #default="{ type, id, attributes }">
        <strong>{{ attributes.label ?? id }}</strong>
        <span class="kind">{{ type === 'node' ? attributes.category : '关系' }}</span>
      </template>
    </SigmaTooltip>

    <div class="demo-panel" data-at="top-left">
      <div class="demo-row">
        <span class="demo-label">触发</span>
        <button v-for="value in (['hover', 'click'] as const)" :key="value" type="button" :aria-pressed="trigger === value" @click="trigger = value">
          {{ value }}
        </button>
      </div>
      <div class="demo-row">
        <span class="demo-label">目标</span>
        <button v-for="value in (['node', 'edge', 'both'] as const)" :key="value" type="button" :aria-pressed="target === value" @click="target = value">
          {{ value }}
        </button>
      </div>
    </div>
  </SigmaGraph>
</template>

<style scoped>
.kind {
  margin-left: 6px;
  opacity: 0.6;
}
</style>

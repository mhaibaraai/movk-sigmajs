<script setup lang="ts">
import { shallowRef } from 'vue'

const last = shallowRef('')

const data = {
  attributes: {},
  options: { type: 'mixed' as const, multi: false, allowSelfLoops: true },
  nodes: [
    { key: 'a', attributes: { label: '制度 A', x: 0, y: 0, size: 14, color: '#f43f5e' } },
    { key: 'b', attributes: { label: '制度 B', x: 340, y: 300, size: 12, color: '#3b82f6' } }
  ],
  edges: [{ source: 'a', target: 'b', attributes: { label: '引用' } }]
}
</script>

<template>
  <SigmaGraph :data="data" :settings="{ enableEdgeEvents: true }">
    <!-- target 决定右键哪里会弹菜单，stage 命中时 id 为 null、锚点走图坐标 -->
    <SigmaContextMenu :target="['node', 'edge', 'stage']">
      <template #default="{ type, id, attributes, close }">
        <div class="menu">
          <span class="head">{{ type }} {{ id ?? '（空白处）' }}</span>
          <button type="button" @click="last = `${type} ${id ?? '-'}`; close()">
            {{ attributes.label ? `操作「${attributes.label}」` : '在此处新建' }}
          </button>
        </div>
      </template>
    </SigmaContextMenu>

    <div class="demo-panel" data-at="top-left">
      <span class="demo-tag">在节点、边、空白处分别右键</span>
      <span class="demo-tag">最近一次：{{ last || '—' }}</span>
    </div>
  </SigmaGraph>
</template>

<style scoped>
.menu {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 140px;
}

.head {
  opacity: 0.6;
  font-size: 12px;
}

.menu button {
  padding: 4px 8px;
  border: 1px solid var(--sigma-color-border);
  border-radius: 4px;
  background: none;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  text-align: left;
}

.menu button:hover {
  background: var(--sigma-color-hover);
}
</style>

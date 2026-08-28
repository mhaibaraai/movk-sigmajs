<script setup lang="ts">
// 插槽作用域 { id, type, attributes, close }。stage 命中时 id 为 null、
// attributes 为 {}，菜单项通常是与具体图元无关的操作
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

function run(action: string, close: () => void) {
  last.value = action
  close()
}
</script>

<template>
  <SigmaGraph :data="data" :settings="{ enableEdgeEvents: true }">
    <SigmaContextMenu :target="['node', 'edge', 'stage']">
      <template #default="{ id, type, attributes, close }">
        <div class="menu">
          <span class="head">{{ type }} {{ id ?? '（空白处）' }}</span>
          <button
            v-if="type === 'stage'"
            type="button"
            @click="run('在此处新建节点', close)"
          >
            在此处新建节点
          </button>
          <button v-else type="button" @click="run(`打开「${attributes.label}」`, close)">
            打开「{{ attributes.label }}」
          </button>
        </div>
      </template>
    </SigmaContextMenu>

    <SigmaControls>
      <div class="bg-accented p-2 text-muted text-xs">
        在节点、边、空白处分别右键 · 最近一次：{{ last || '—' }}
      </div>
    </SigmaControls>
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

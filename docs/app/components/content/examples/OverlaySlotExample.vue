<script setup lang="ts">
// 默认插槽没有作用域，内容全由使用方决定。两件必做的事：
// 插槽内容自行 v-if（隐藏期间不残留），以及在自己的元素上恢复 pointer-events
const open = shallowRef(true)
const votes = shallowRef(0)

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
    <SigmaOverlay node="a" :offset="[0, -20]" :visible="open">
      <div v-if="open" class="card">
        <strong>节点 A</strong>
        <p>覆盖层不规定内容，表单、按钮、富文本都能放。</p>
        <div class="actions">
          <button type="button" @click="votes += 1">
            赞同 {{ votes }}
          </button>
          <button type="button" @click="open = false">
            关闭
          </button>
        </div>
      </div>
    </SigmaOverlay>

    <SigmaControls>
      <UButton :disabled="open" label="重新打开" @click="open = true" />
    </SigmaControls>
  </SigmaGraph>
</template>

<style scoped>
.card {
  /* .sigma-overlay 的 pointer-events 是 none，可交互内容必须自己恢复 */
  pointer-events: auto;
  translate: -50% -100%;
  width: 200px;
  padding: 10px 12px;
  border: 1px solid var(--sigma-color-border);
  border-radius: 8px;
  background: var(--sigma-color-bg);
  box-shadow: var(--sigma-shadow-md);
  font-size: 12px;
}

.card p {
  margin: 6px 0 8px;
  color: var(--sigma-color-muted);
}

.actions {
  display: flex;
  gap: 6px;
}

.actions button {
  padding: 3px 8px;
  border: 1px solid var(--sigma-color-border);
  border-radius: 4px;
  background: none;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
}

.actions button:hover {
  background: var(--sigma-color-hover);
}
</style>

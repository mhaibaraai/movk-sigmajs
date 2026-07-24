<script setup lang="ts">
import type { SerializedGraph } from 'graphology-types'

const data = ref<SerializedGraph>({
  attributes: {},
  options: { type: 'mixed', multi: false, allowSelfLoops: true },
  nodes: [
    { key: 'a', attributes: { label: '制度 A', x: 0, y: 0, size: 14, color: '#f43f5e' } },
    { key: 'b', attributes: { label: '制度 B', x: 12, y: 5, size: 11, color: '#3b82f6' } },
    { key: 'c', attributes: { label: '制度 C', x: 6, y: -7, size: 9, color: '#22c55e' } },
    { key: 'd', attributes: { label: '制度 D', x: -9, y: 6, size: 10, color: '#a855f7' } }
  ],
  edges: [
    { source: 'a', target: 'b', attributes: { label: '引用' } },
    { source: 'b', target: 'c', attributes: { label: '引用' } },
    { source: 'a', target: 'd', attributes: { label: '引用' } }
  ]
})
</script>

<template>
  <main class="page">
    <header>
      <h1>@movk/sigma playground</h1>
      <p>M2 交互原语：reducer 链、选中高亮、邻域展开与覆盖层。</p>
    </header>

    <section>
      <h2>1. 声明式用法</h2>
      <p class="hint">
        悬浮看提示，点击节点高亮邻居并弹出详情面板（详情按需加载，不随图数据下发），
        面板里可展开邻域，右键节点也能展开。
      </p>
      <div class="stage">
        <SigmaGraph
          id="demo"
          :data="data"
          :settings="{ renderEdgeLabels: true, enableEdgeEvents: true }"
        >
          <GraphInteraction />
        </SigmaGraph>
      </div>
    </section>

    <section>
      <h2>2. 纯原生逃生舱</h2>
      <p class="hint">
        下面这块不使用本库的任何 composable 与控件，只借 <code>SigmaGraph</code> 拿到实例后全走 sigma /
        graphology 原生 API，用来证明封装可以被完全绕过。
      </p>
      <EscapeHatch />
    </section>
  </main>
</template>

<style scoped>
.page {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
  font-family: system-ui, sans-serif;
}

section {
  margin-block: 32px;
}

.stage {
  height: 360px;
  border: 1px solid #d0d7de;
  border-radius: 8px;
  overflow: hidden;
}

.hint {
  color: #57606a;
  font-size: 14px;
}
</style>

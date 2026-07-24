<script setup lang="ts">
import type { SerializedGraph } from 'graphology-types'

const data = ref<SerializedGraph>({
  attributes: {},
  options: { type: 'mixed', multi: false, allowSelfLoops: true },
  nodes: [
    { key: 'a', attributes: { label: '制度 A', x: 0, y: 0, size: 14, color: '#f43f5e' } },
    { key: 'b', attributes: { label: '制度 B', x: 12, y: 5, size: 11, color: '#3b82f6' } },
    { key: 'c', attributes: { label: '制度 C', x: 6, y: -7, size: 9, color: '#22c55e' } }
  ],
  edges: [
    { source: 'a', target: 'b', attributes: { label: '引用' } },
    { source: 'b', target: 'c', attributes: { label: '引用' } }
  ]
})

const lastEvent = ref('（尚未交互）')

function expand() {
  // 服务端只回增量，且不带坐标；已有节点的布局结果不应被冲掉
  data.value = {
    ...data.value,
    nodes: [
      ...data.value.nodes.map(node => ({ key: node.key, attributes: { ...node.attributes, x: undefined, y: undefined } })),
      { key: 'd', attributes: { label: '制度 D', x: -9, y: 6, size: 10, color: '#a855f7' } }
    ],
    edges: [...data.value.edges, { source: 'c', target: 'd', attributes: { label: '引用' } }]
  } as SerializedGraph
}
</script>

<template>
  <main class="page">
    <header>
      <h1>@movk/sigma playground</h1>
      <p>M1 地基：根组件、响应式桥接、相机与事件。控件与覆盖层在后续里程碑。</p>
    </header>

    <section>
      <h2>1. 声明式用法</h2>
      <div class="actions">
        <button
          type="button"
          @click="expand"
        >
          增量展开（新数据不带坐标）
        </button>
      </div>
      <div class="stage">
        <SigmaGraph
          id="demo"
          :data="data"
          :settings="{ renderEdgeLabels: true }"
          @click-node="lastEvent = `clickNode: ${$event.node}`"
          @enter-node="lastEvent = `enterNode: ${$event.node}`"
        >
          <GraphStats />
        </SigmaGraph>
      </div>
      <p class="hint">
        最近事件：{{ lastEvent }}
      </p>
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
  height: 320px;
  border: 1px solid #d0d7de;
  border-radius: 8px;
  overflow: hidden;
}

.actions {
  margin-bottom: 12px;
}

.hint {
  color: #57606a;
  font-size: 14px;
}
</style>

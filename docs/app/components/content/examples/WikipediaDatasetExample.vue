<script setup lang="ts">
import { shallowRef } from 'vue'
import type { SerializedGraph } from 'graphology-types'

/**
 * 加载 sigma 官方的 wikipedia 数据集：2085 个节点、5409 条边、24 个社区。
 *
 * 换算逻辑全在 loadWikipediaGraph() 里：原始数据不带 color 也不带 size，
 * 颜色取自所属社区、size 由 score 放大，坐标与 size 一起按同一比例归一化。
 */
const data = shallowRef<SerializedGraph | null>(null)
const communities = shallowRef(0)
const loadMs = shallowRef(0)
const error = shallowRef('')
const loading = shallowRef(false)

async function load() {
  loading.value = true
  error.value = ''
  const t0 = performance.now()

  try {
    const graph = await loadWikipediaGraph()
    communities.value = new Set(graph.nodes.map(node => node.attributes?.category)).size
    loadMs.value = performance.now() - t0
    data.value = graph
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause)
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="wrap">
    <SigmaGraph
      v-if="data"
      :data="data"
      :settings="{ hideEdgesOnMove: true, labelRenderedSizeThreshold: 8 }"
    >
      <SigmaControls position="top-right">
        <!-- 检索的是真实词条名，不是生成出来的编号 -->
        <SigmaSearchControl :fields="['label', 'category']" :limit="6" placeholder="试试「graph」" />
        <SigmaZoomControl />
      </SigmaControls>

      <SigmaTooltip />

      <div class="demo-panel" data-at="bottom-left">
        <span class="demo-tag">{{ data.nodes.length }} 节点 · {{ data.edges.length }} 边 · {{ communities }} 个社区</span>
        <span class="demo-tag">加载并换算耗时 {{ loadMs.toFixed(0) }} ms</span>
      </div>
    </SigmaGraph>

    <p v-else class="idle">
      <button type="button" :disabled="loading" @click="load">
        {{ loading ? '加载中…' : '加载官方数据集（886 KB）' }}
      </button>
      <span v-if="error" class="demo-tag">{{ error }}</span>
    </p>
  </div>
</template>

<style scoped>
.wrap {
  position: relative;
  /* .example-stage 是 flex 行容器，不给宽度会缩成内容宽 */
  width: 100%;
  height: 100%;
}

.idle {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  height: 100%;
  margin: 0;
}

.idle button {
  padding: 6px 14px;
  border: 1px solid var(--sigma-color-border);
  border-radius: 6px;
  background: var(--sigma-color-bg);
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
}
</style>

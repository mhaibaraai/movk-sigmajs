<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import type { StylesDeclaration } from 'sigma/types'

/**
 * 加载 sigma 官方的 wikipedia 数据集：2085 个节点、5409 条边、24 个社区。
 *
 * 原始数据不带 color 也不带 size，节点只存 cluster 与 score 两个语义属性，
 * 换算成颜色与尺寸全在下面的 styles 里。
 */
const dataset = shallowRef<Awaited<ReturnType<typeof loadWikipediaGraph>> | null>(null)
const loadMs = shallowRef(0)
const error = shallowRef('')
const loading = shallowRef(false)

const styles = computed<StylesDeclaration>(() => ({
  nodes: {
    label: { attribute: 'label' },
    color: { attribute: 'cluster', dict: dataset.value?.clusterColors ?? {}, defaultValue: '#94a3b8' },
    size: {
      attribute: 'score',
      min: 3,
      max: 18,
      minValue: dataset.value?.scoreExtent[0],
      maxValue: dataset.value?.scoreExtent[1]
    }
  }
}))

async function load() {
  loading.value = true
  error.value = ''
  const t0 = performance.now()

  try {
    const result = await loadWikipediaGraph()
    loadMs.value = performance.now() - t0
    dataset.value = result
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
      v-if="dataset"
      :graph="dataset.graph"
      :styles="styles"
      :settings="{ hideEdgesOnMove: true, labelRenderedSizeThreshold: 8 }"
    >
      <SigmaControls position="top-right">
        <!-- 检索的是真实词条名，不是生成出来的编号 -->
        <SigmaSearchControl :fields="['label']" :limit="6" placeholder="试试「graph」" />
        <SigmaZoomControl />
      </SigmaControls>

      <SigmaTooltip />

      <div class="demo-panel" data-at="bottom-left">
        <span class="demo-tag">{{ dataset.graph.order }} 节点 · {{ dataset.graph.size }} 边 · {{ Object.keys(dataset.clusterColors).length }} 个社区</span>
        <span class="demo-tag">加载并建图耗时 {{ loadMs.toFixed(0) }} ms</span>
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

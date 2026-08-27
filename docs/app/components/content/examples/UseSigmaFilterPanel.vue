<script setup lang="ts">
import { shallowRef } from 'vue'

/**
 * 声明式过滤，落到 sigma 的 isHidden 状态上。
 *
 * 不改动图数据本身：被隐藏的节点仍在 graphology 里，邻域计算与检索照常能看到它们。
 */
const { nodeFilter, edgeFilter, only, reset, hiddenCount } = useSigmaFilter()
const { degrees, maxDegree } = useSigmaMetrics()

const mode = shallowRef<'none' | 'category' | 'degree' | 'hubs' | 'edge'>('none')

function byCategory() {
  mode.value = 'category'
  edgeFilter.value = null
  nodeFilter.value = (_key, attributes) => attributes.category === 'Network Science'
}

function byDegree() {
  mode.value = 'degree'
  edgeFilter.value = null
  nodeFilter.value = key => (degrees.value[key] ?? 0) >= 2
}

function byEdgeLabel() {
  mode.value = 'edge'
  nodeFilter.value = null
  edgeFilter.value = (_key, attributes) => attributes.label === '跨域'
}

function hubsOnly() {
  mode.value = 'hubs'
  only(Object.keys(degrees.value).filter(key => degrees.value[key]! >= maxDegree.value))
}

function clearAll() {
  mode.value = 'none'
  reset()
}
</script>

<template>
  <div class="demo-panel" data-at="top-left">
    <div class="demo-row">
      <span class="demo-label">按</span>
      <button type="button" :aria-pressed="mode === 'category'" @click="byCategory">
        分类
      </button>
      <button type="button" :aria-pressed="mode === 'degree'" @click="byDegree">
        度数 ≥ 2
      </button>
      <button type="button" :aria-pressed="mode === 'edge'" @click="byEdgeLabel">
        边类型
      </button>
      <button type="button" :aria-pressed="mode === 'hubs'" @click="hubsOnly">
        只看枢纽
      </button>
      <button type="button" @click="clearAll">
        取消
      </button>
    </div>
    <span class="demo-tag">已隐藏 {{ hiddenCount }} 个节点 · 最大度 {{ maxDegree }}</span>
  </div>
</template>

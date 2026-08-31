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
  <SigmaControls>
    <div class="flex gap-1">
      <UButton size="xs" label="分类" :color="mode === 'category' ? 'primary' : 'neutral'" @click="byCategory" />
      <UButton size="xs" label="度数 ≥ 2" :color="mode === 'degree' ? 'primary' : 'neutral'" @click="byDegree" />
      <UButton size="xs" label="边类型" :color="mode === 'edge' ? 'primary' : 'neutral'" @click="byEdgeLabel" />
      <UButton size="xs" label="只看枢纽" :color="mode === 'hubs' ? 'primary' : 'neutral'" @click="hubsOnly" />
      <UButton size="xs" color="neutral" variant="ghost" label="取消" @click="clearAll" />
    </div>

    <div class="bg-accented p-2 text-muted text-xs">
      已隐藏 {{ hiddenCount }} 个节点 · 最大度 {{ maxDegree }}
    </div>
  </SigmaControls>
</template>
